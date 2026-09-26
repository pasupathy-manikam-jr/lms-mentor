<?php

namespace Tests\Feature;

use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AboutPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_about_page_shows_live_figures_and_the_team()
    {
        $this->seed(LandingSeeder::class);

        $this->get(route('about'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('about')
                ->where('stats.courses', 16)
                ->where('stats.learners', 11060)
                ->where('stats.instructors', 6)
                ->has('instructors', 6));
    }
}
