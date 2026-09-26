<?php

namespace Tests\Feature;

use Database\Seeders\ExamSeeder;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExamCatalogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([LandingSeeder::class, ExamSeeder::class]);
    }

    public function test_catalog_lists_exams_with_category_counts()
    {
        $this->get(route('exams.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('exams/index')
                ->where('exams.total', 8)
                ->has('exams.data.0.instructor.name')
                ->where('categories.0.items_count', 1));
    }

    public function test_catalog_filters_by_price_and_level()
    {
        $this->get(route('exams.index', ['price' => 'free']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('exams.total', 1)
                ->where('exams.data.0.title', 'Medical Terminology Proficiency Test'));

        $this->get(route('exams.index', ['level' => 'advanced']))
            ->assertInertia(fn (Assert $page) => $page->where('exams.total', 2));
    }

    public function test_exam_page_shows_the_exam_format_and_instructor()
    {
        $this->get(route('exams.show', 'clinical-pharmacology-knowledge-exam'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('exams/show')
                ->where('exam.questions_count', 75)
                ->where('exam.pass_percentage', 70)
                ->where('exam.max_attempts', 3)
                ->where('exam.instructor.name', 'Dr. Marcus Bell')
                ->where('exam.category.slug', 'pharmacology'));
    }

    public function test_unknown_exam_returns_not_found()
    {
        $this->get('/exams/no-such-exam')->assertNotFound();
    }
}
