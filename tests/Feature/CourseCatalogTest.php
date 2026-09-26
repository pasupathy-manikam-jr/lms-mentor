<?php

namespace Tests\Feature;

use App\Models\Course;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CourseCatalogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(LandingSeeder::class);
    }

    public function test_catalog_lists_courses_twelve_per_page()
    {
        $this->get(route('courses.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('courses/index')
                ->has('courses.data', 12)
                ->where('courses.total', 16)
                ->has('categories', 8));
    }

    public function test_catalog_filters_by_category_search_price_and_level()
    {
        $this->get(route('courses.index', ['category' => 'ayurveda']))
            ->assertInertia(fn (Assert $page) => $page->where('courses.total', 3));

        $this->get(route('courses.index', ['search' => 'siddha']))
            ->assertInertia(fn (Assert $page) => $page->where('courses.total', 2));

        Course::query()->first()->update(['price' => 0]);

        $this->get(route('courses.index', ['price' => 'free']))
            ->assertInertia(fn (Assert $page) => $page->where('courses.total', 1));

        $this->get(route('courses.index', ['level' => 'advanced']))
            ->assertInertia(fn (Assert $page) => $page->where('courses.total', 3));

        $this->get(route('courses.index', ['price' => 'paid', 'category' => 'management-science']))
            ->assertInertia(fn (Assert $page) => $page->where('courses.total', 2));
    }

    public function test_catalog_rejects_unknown_filters()
    {
        $this->get(route('courses.index', ['price' => 'cheap']))
            ->assertSessionHasErrors('price');
    }

    public function test_course_page_shows_the_course_its_instructor_and_related_courses()
    {
        $this->get(route('courses.show', 'foundations-of-ayurveda-doshas-dhatus-prakriti'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('courses/show')
                ->where('course.title', 'Foundations of Ayurveda: Doshas, Dhatus & Prakriti')
                ->where('course.level', 'beginner')
                ->where('course.category.slug', 'ayurveda')
                ->where('course.instructor.name', 'Dr. Ananya Rao')
                ->has('relatedCourses', 2)
                ->has('categories', 8));
    }

    public function test_unknown_course_returns_not_found()
    {
        $this->get('/courses/no-such-course')->assertNotFound();
    }
}
