<?php

namespace Tests\Feature;

use App\Models\Instructor;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TeamPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_team_page_lists_instructors_with_their_course_and_learner_counts()
    {
        $this->seed(LandingSeeder::class);

        $this->get(route('team.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('team/index')
                ->has('instructors', 6)
                ->where('instructors.0.name', 'Dr. Ananya Rao')
                ->where('instructors.0.courses_count', 4)
                ->has('instructors.0.learners_count'));
    }

    public function test_team_member_page_shows_their_courses_and_totals()
    {
        $this->seed(LandingSeeder::class);
        $instructor = Instructor::where('name', 'Dr. Ananya Rao')->firstOrFail();

        $this->get(route('team.show', $instructor))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('team/show')
                ->where('instructor.name', 'Dr. Ananya Rao')
                ->has('courses', 4)
                ->where('stats.courses', 4)
                ->where('stats.learners', 2780));
    }

    public function test_unknown_team_member_returns_not_found()
    {
        $this->get('/our-team/999')->assertNotFound();
    }
}
