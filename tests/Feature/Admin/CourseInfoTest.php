<?php

namespace Tests\Feature\Admin;

use App\Enums\CourseInfoType;
use App\Models\Course;
use App\Models\CourseInfoItem;
use App\Models\User;
use Database\Seeders\CourseInfoSeeder;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CourseInfoTest extends TestCase
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

    public function test_faqs_requirements_and_outcomes_can_be_added_edited_and_removed()
    {
        $this->actingAs($this->admin);
        $store = route('admin.courses.info.store', $this->course);

        $this->post($store, ['type' => 'faq', 'title' => 'Who is it for?', 'body' => 'New ward managers.'])->assertSessionHasNoErrors();
        $this->post($store, ['type' => 'requirement', 'title' => 'Basic reading skills'])->assertSessionHasNoErrors();
        $this->post($store, ['type' => 'outcome', 'title' => 'Plan a shift roster'])->assertSessionHasNoErrors();

        $faq = $this->course->infoItems()->where('type', CourseInfoType::Faq)->firstOrFail();
        $this->put(route('admin.courses.info.update', [$this->course, $faq]), ['title' => 'Who should enrol?', 'body' => 'New ward managers.']);
        $this->assertSame('Who should enrol?', $faq->refresh()->title);

        $this->delete(route('admin.courses.info.destroy', [$this->course, $faq]));
        $this->assertModelMissing($faq);

        $this->get(route('admin.courses.edit', $this->course))
            ->assertInertia(fn (Assert $page) => $page
                ->where('info.requirement.0.title', 'Basic reading skills')
                ->where('info.outcome.0.title', 'Plan a shift roster'));
    }

    public function test_faqs_need_an_answer_and_other_lists_take_only_text()
    {
        $this->actingAs($this->admin);
        $store = route('admin.courses.info.store', $this->course);

        $this->post($store, ['type' => 'faq', 'title' => 'Q?'])->assertSessionHasErrors('body');
        $this->post($store, ['type' => 'outcome', 'title' => 'x', 'body' => 'not allowed'])->assertSessionHasErrors('body');
        $this->post($store, ['type' => 'note', 'title' => 'x'])->assertSessionHasErrors('type');

        $this->actingAs(User::factory()->create())->post($store, ['type' => 'outcome', 'title' => 'x'])->assertForbidden();
    }

    public function test_items_of_another_course_are_not_found_and_the_course_page_shows_the_info()
    {
        $other = Course::whereKeyNot($this->course->id)->firstOrFail();
        $foreign = CourseInfoItem::create(['course_id' => $other->id, 'type' => 'outcome', 'title' => 'Theirs']);

        $this->actingAs($this->admin)->delete(route('admin.courses.info.destroy', [$this->course, $foreign]))->assertNotFound();

        $this->seed(CourseInfoSeeder::class);
        $this->get(route('courses.show', $this->course->slug))
            ->assertInertia(fn (Assert $page) => $page->has('info.faq', 4)->has('info.requirement')->has('info.outcome'));
    }
}
