<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\User;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LearningTest extends TestCase
{
    use RefreshDatabase;

    public function test_my_courses_lists_enrolments_with_progress()
    {
        $this->seed(LandingSeeder::class);
        $course = Course::approved()->firstOrFail();
        $first = $course->lessons()->create(['title' => 'One', 'type' => 'lesson', 'position' => 1]);
        $course->lessons()->create(['title' => 'Two', 'type' => 'lesson', 'position' => 2]);
        $student = User::factory()->create();
        $student->enrollments()->create(['course_id' => $course->id, 'price_paid' => 0]);
        $student->completedLessons()->attach($first);

        $this->actingAs($student)->get(route('learning.courses'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('learning/courses')
                ->has('courses', 1)
                ->where('courses.0.course.slug', $course->slug)
                ->where('courses.0.progress', (int) round(1 / $course->lessons()->count() * 100)));
    }

    public function test_courses_are_saved_to_and_removed_from_the_wishlist()
    {
        $this->seed(LandingSeeder::class);
        $course = Course::approved()->firstOrFail();
        $student = User::factory()->create();

        $this->actingAs($student)->post(route('learning.wishlist.toggle', $course))->assertRedirect();
        $this->get(route('courses.show', $course))->assertInertia(fn (Assert $page) => $page->where('wishlisted', true));
        $this->get(route('learning.wishlist'))->assertInertia(fn (Assert $page) => $page->has('courses', 1)->where('courses.0.id', $course->id));

        $this->post(route('learning.wishlist.toggle', $course));
        $this->get(route('learning.wishlist'))->assertInertia(fn (Assert $page) => $page->has('courses', 0));

        auth()->logout();
        $this->get(route('learning.wishlist'))->assertRedirect(route('login'));
    }
}
