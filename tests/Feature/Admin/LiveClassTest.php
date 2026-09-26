<?php

namespace Tests\Feature\Admin;

use App\Models\Course;
use App\Models\LiveClass;
use App\Models\User;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LiveClassTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(LandingSeeder::class);
        $this->admin = User::factory()->admin()->create();
        $this->course = Course::orderBy('id')->firstOrFail();
    }

    public function test_a_class_is_scheduled_in_utc_edited_and_deleted()
    {
        $this->actingAs($this->admin)
            ->post(route('admin.courses.live-classes.store', $this->course), $this->payload(['starts_at' => '2026-10-01T10:00:00+05:30']))
            ->assertSessionHasNoErrors();

        $liveClass = $this->course->liveClasses()->firstOrFail();
        $this->assertSame('2026-10-01 04:30:00', $liveClass->starts_at->format('Y-m-d H:i:s'));

        $this->actingAs($this->admin)
            ->put(route('admin.courses.live-classes.update', [$this->course, $liveClass]), $this->payload(['topic' => 'Ward rounds Q&A']))
            ->assertSessionHasNoErrors();
        $this->assertSame('Ward rounds Q&A', $liveClass->refresh()->topic);

        $this->actingAs($this->admin)->delete(route('admin.courses.live-classes.destroy', [$this->course, $liveClass]));
        $this->assertModelMissing($liveClass);
    }

    public function test_only_https_meeting_links_are_accepted_and_students_cannot_schedule()
    {
        $this->actingAs($this->admin)
            ->post(route('admin.courses.live-classes.store', $this->course), $this->payload(['meeting_url' => 'javascript:alert(1)']))
            ->assertSessionHasErrors('meeting_url');

        $this->actingAs(User::factory()->create())
            ->post(route('admin.courses.live-classes.store', $this->course), $this->payload())
            ->assertForbidden();
    }

    public function test_status_follows_the_clock_and_classes_reach_the_editor_and_player()
    {
        Carbon::setTestNow('2026-10-01 10:30:00');
        $liveClass = LiveClass::create(['course_id' => $this->course->id, 'topic' => 'Live', 'starts_at' => '2026-10-01 10:00:00', 'duration_minutes' => 60, 'meeting_url' => 'https://meet.google.com/abc']);

        $this->assertSame('live', $liveClass->status());
        Carbon::setTestNow('2026-10-01 11:01:00');
        $this->assertSame('ended', $liveClass->status());
        Carbon::setTestNow('2026-10-01 09:00:00');
        $this->assertSame('upcoming', $liveClass->status());

        $this->actingAs($this->admin)->get(route('admin.courses.edit', $this->course))
            ->assertInertia(fn (Assert $page) => $page->where('liveClasses.0.topic', 'Live')->where('liveClasses.0.status', 'upcoming'));
        $this->actingAs($this->admin)->get(route('courses.learn', ['course' => $this->course]))
            ->assertInertia(fn (Assert $page) => $page->where('liveClasses.0.meeting_url', 'https://meet.google.com/abc'));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'topic' => 'Leadership Q&A', 'starts_at' => '2026-10-01T10:00:00Z',
            'meeting_url' => 'https://zoom.us/j/123456789', 'notes' => '', ...$overrides,
        ];
    }
}
