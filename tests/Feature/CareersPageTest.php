<?php

namespace Tests\Feature;

use App\Models\JobOpening;
use Database\Seeders\JobOpeningSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CareersPageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(JobOpeningSeeder::class);
    }

    public function test_careers_lists_open_jobs_soonest_deadline_first()
    {
        JobOpening::where('slug', 'medical-content-reviewer')->update(['deadline' => today()->subDay()]);

        $this->get(route('careers.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('careers/index')
                ->where('jobs.total', 5)
                ->where('jobs.data.0.title', 'Learning Experience Designer'));
    }

    public function test_careers_searches_by_title()
    {
        $this->get(route('careers.index', ['search' => 'intern']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('jobs.total', 1)
                ->where('jobs.data.0.slug', 'healthcare-management-intern'));
    }

    public function test_job_page_shows_an_open_job_and_hides_a_closed_one()
    {
        $this->get(route('careers.show', 'ayurveda-course-instructor'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('careers/show')
                ->where('job.positions', 2)
                ->has('job.skills', 4));

        JobOpening::where('slug', 'ayurveda-course-instructor')->update(['deadline' => today()->subDay()]);

        $this->get(route('careers.show', 'ayurveda-course-instructor'))->assertNotFound();
    }
}
