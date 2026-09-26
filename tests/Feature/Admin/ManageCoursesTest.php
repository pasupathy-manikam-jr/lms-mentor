<?php

namespace Tests\Feature\Admin;

use App\Enums\CourseStatus;
use App\Models\Assignment;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ManageCoursesTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(LandingSeeder::class);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_the_list_shows_courses_with_instructor_category_and_assignment_count()
    {
        $course = Course::orderBy('id')->firstOrFail();
        Assignment::create(['course_id' => $course->id, 'title' => 'Case study']);

        $this->actingAs($this->admin)
            ->get(route('admin.courses.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/courses/index')
                ->where('courses.total', 16)
                ->has('courses.data', 10)
                ->where('courses.data.0.id', $course->id)
                ->where('courses.data.0.assignments_count', 1)
                ->has('courses.data.0.instructor.name')
                ->has('courses.data.0.category.name')
                ->where('statuses', ['approved', 'upcoming', 'pending', 'private', 'draft']));
    }

    public function test_search_status_filter_sorting_and_page_size()
    {
        Course::where('slug', 'varmam-therapy-an-introduction')->update(['status' => CourseStatus::Draft]);

        $this->actingAs($this->admin)
            ->get(route('admin.courses.index', ['search' => 'varmam']))
            ->assertInertia(fn (Assert $page) => $page->where('courses.total', 1));

        $this->actingAs($this->admin)
            ->get(route('admin.courses.index', ['status' => 'draft']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('courses.total', 1)
                ->where('courses.data.0.slug', 'varmam-therapy-an-introduction'));

        $cheapest = Course::orderBy('price')->orderBy('id')->firstOrFail();
        $this->actingAs($this->admin)
            ->get(route('admin.courses.index', ['sort' => 'price', 'direction' => 'asc', 'per_page' => 20]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('courses.data.0.id', $cheapest->id)
                ->has('courses.data', 16));

        $this->actingAs($this->admin)
            ->get(route('admin.courses.index', ['sort' => 'name', 'direction' => 'desc']))
            ->assertInertia(fn (Assert $page) => $page->where('courses.data.0.instructor.name', 'Prof. Meera Iyer'));

        $this->actingAs($this->admin)
            ->get(route('admin.courses.index', ['status' => 'archived']))
            ->assertSessionHasErrors('status');
    }

    public function test_changing_a_course_status()
    {
        $course = Course::firstOrFail();

        $this->actingAs($this->admin)
            ->patch(route('admin.courses.status', $course), ['status' => 'private'])
            ->assertRedirect();

        $this->assertSame(CourseStatus::Private, $course->fresh()->status);
    }

    public function test_deleting_a_course_removes_its_lessons_but_courses_with_students_are_kept()
    {
        [$empty, $taken] = Course::orderBy('id')->take(2)->get();
        Lesson::create(['course_id' => $empty->id, 'title' => 'Intro', 'position' => 1]);
        Enrollment::create(['user_id' => User::factory()->create()->id, 'course_id' => $taken->id]);

        $this->actingAs($this->admin)->delete(route('admin.courses.destroy', $empty))->assertRedirect();
        $this->assertModelMissing($empty);
        $this->assertSame(0, Lesson::count());

        $this->actingAs($this->admin)->delete(route('admin.courses.destroy', $taken))->assertRedirect();
        $this->assertModelExists($taken);
    }

    public function test_non_admins_cannot_manage_courses()
    {
        $student = User::factory()->create();
        $course = Course::firstOrFail();

        $this->actingAs($student)->get(route('admin.courses.index'))->assertForbidden();
        $this->actingAs($student)->patch(route('admin.courses.status', $course), ['status' => 'draft'])->assertForbidden();
        $this->actingAs($student)->delete(route('admin.courses.destroy', $course))->assertForbidden();
    }
}
