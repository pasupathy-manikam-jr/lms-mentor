<?php

namespace Tests\Feature;

use App\Enums\CourseStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Instructor;
use App\Models\Lesson;
use App\Models\PayoutRequest;
use App\Models\User;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_admins_see_the_overview()
    {
        $this->seed(LandingSeeder::class);
        [$student] = User::factory()->count(2)->create();
        $course = Course::firstOrFail();
        $course->update(['status' => CourseStatus::Draft]);
        Lesson::create(['course_id' => $course->id, 'title' => 'What is prakriti?', 'position' => 1]);
        Enrollment::create(['user_id' => $student->id, 'course_id' => $course->id, 'price_paid' => 100]);
        PayoutRequest::create(['instructor_id' => Instructor::firstOrFail()->id, 'amount' => 250]);
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('stats.courses', 16)
                ->where('stats.lessons', 1)
                ->where('stats.enrollments', 1)
                ->where('stats.students', 2)
                ->where('stats.instructors', 6)
                // 30% of the 100 paid this month is admin revenue (instructors keep 70%).
                ->where('revenueByMonth.'.(now()->month - 1).'.revenue', 30)
                ->has('revenueByMonth', 12)
                ->where('courseStatus.0', ['status' => 'approved', 'count' => 15])
                ->where('courseStatus.4', ['status' => 'draft', 'count' => 1])
                ->has('pendingWithdrawals', 1)
                ->where('pendingWithdrawals.0.amount', '250.00'));
    }

    public function test_draft_courses_are_hidden_from_the_public_catalog()
    {
        $this->seed(LandingSeeder::class);
        $course = Course::firstOrFail();
        $course->update(['status' => CourseStatus::Draft]);

        $this->get(route('courses.index'))
            ->assertInertia(fn (Assert $page) => $page->where('courses.total', 15));

        $this->get(route('courses.show', $course->slug))->assertNotFound();
    }

    public function test_non_admins_are_sent_back_to_the_site()
    {
        $student = User::factory()->create();

        $this->actingAs($student)
            ->get(route('dashboard'))
            ->assertRedirect(route('home'));
    }

    public function test_approved_instructors_get_their_own_dashboard_and_students_go_home()
    {
        $this->seed(LandingSeeder::class);
        $instructor = Instructor::whereHas('courses')->firstOrFail();
        $user = User::factory()->create();
        $instructor->update(['user_id' => $user->id, 'status' => 'approved']);

        $this->actingAs($user)->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('dashboard')
                ->where('role', 'instructor')
                ->where('stats.courses', $instructor->courses()->count())
                ->missing('stats.instructors')
                ->has('revenueByMonth', 12));

        $instructor->update(['status' => 'pending']);
        $this->get(route('dashboard'))->assertRedirect(route('home'));
    }
}
