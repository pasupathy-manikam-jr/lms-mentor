<?php

namespace Tests\Feature\Admin;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Exam;
use App\Models\ExamEnrollment;
use App\Models\User;
use Database\Seeders\ExamSeeder;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EnrollmentTest extends TestCase
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

    public function test_an_admin_enrols_a_user_free_or_paid_and_can_remove_the_enrolment()
    {
        $student = User::factory()->create(['name' => 'Meena Pillai']);
        $this->actingAs($this->admin);

        $this->post(route('admin.course-enrollments.store'), ['user_id' => $student->id, 'item_id' => $this->course->id, 'enrollment_type' => 'paid'])
            ->assertSessionHasNoErrors();

        $enrollment = Enrollment::firstOrFail();
        $this->assertSame($this->course->price, $enrollment->price_paid);
        $this->assertNull($enrollment->expires_at);

        $this->post(route('admin.course-enrollments.store'), ['user_id' => $student->id, 'item_id' => $this->course->id, 'enrollment_type' => 'free'])
            ->assertSessionHasErrors('item_id');

        $this->get(route('admin.course-enrollments.index', ['search' => 'meena']))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/course-enrollments/index')
                ->where('enrollments.total', 1)
                ->where('enrollments.data.0.user.name', 'Meena Pillai'));

        $this->delete(route('admin.course-enrollments.destroy', $enrollment));
        $this->assertModelMissing($enrollment);
    }

    public function test_limited_courses_get_an_expiry_and_expired_enrolments_lose_player_access()
    {
        Carbon::setTestNow('2026-10-01 10:00:00');
        $this->course->update(['expiry_type' => 'limited_time', 'expiry_months' => 3]);
        $student = User::factory()->create();

        $this->actingAs($this->admin)
            ->post(route('admin.course-enrollments.store'), ['user_id' => $student->id, 'item_id' => $this->course->id, 'enrollment_type' => 'free'])
            ->assertSessionHasNoErrors();

        $enrollment = Enrollment::firstOrFail();
        $this->assertSame('2027-01-01 10:00:00', $enrollment->expires_at->format('Y-m-d H:i:s'));
        $this->assertSame('0.00', $enrollment->price_paid);

        $this->actingAs($student)->get(route('courses.learn', ['course' => $this->course]))->assertOk();

        Carbon::setTestNow('2027-01-02 00:00:00');
        $this->actingAs($student)->get(route('courses.learn', ['course' => $this->course]))->assertForbidden();
    }

    public function test_exam_enrolments_are_listed_separately_and_recorded_with_the_exam_price()
    {
        $this->seed(ExamSeeder::class);
        $exam = Exam::where('price', '>', 0)->orderBy('id')->firstOrFail();
        $student = User::factory()->create();
        $this->actingAs($this->admin);

        $this->post(route('admin.exam-enrollments.store'), ['user_id' => $student->id, 'item_id' => $exam->id, 'enrollment_type' => 'paid'])
            ->assertSessionHasNoErrors();
        $this->post(route('admin.exam-enrollments.store'), ['user_id' => $student->id, 'item_id' => $exam->id, 'enrollment_type' => 'free'])
            ->assertSessionHasErrors('item_id');

        $enrollment = ExamEnrollment::firstOrFail();
        $this->assertSame($exam->price, $enrollment->price_paid);
        $this->assertSame(0, Enrollment::count());

        $this->get(route('admin.exam-enrollments.index'))
            ->assertInertia(fn (Assert $page) => $page->where('scope', 'exam')->where('enrollments.total', 1)->where('enrollments.data.0.item.title', $exam->title));
        $this->get(route('admin.course-enrollments.index'))
            ->assertInertia(fn (Assert $page) => $page->where('enrollments.total', 0));

        $this->delete(route('admin.exam-enrollments.destroy', $enrollment->id));
        $this->assertModelMissing($enrollment);
    }

    public function test_students_cannot_manage_enrolments()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.course-enrollments.index'))
            ->assertForbidden();
    }
}
