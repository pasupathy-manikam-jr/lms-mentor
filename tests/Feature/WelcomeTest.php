<?php

namespace Tests\Feature;

use App\Models\Post;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WelcomeTest extends TestCase
{
    use RefreshDatabase;

    public function test_landing_page_preload_header_stays_under_the_apache_limit()
    {
        $this->seed(LandingSeeder::class);

        $link = (string) $this->get(route('home'))->assertOk()->headers->get('Link');

        // Apache answers an empty 500 when one header passes ~8KB; the list is capped at 30 entries.
        $this->assertLessThanOrEqual(30, substr_count($link, 'rel="'));
    }

    public function test_landing_page_shows_content_from_the_database()
    {
        $this->seed(LandingSeeder::class);

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->has('categories', 8)
                ->where('categories.0.courses_count', 3)
                ->has('popularCourses', 8, fn (Assert $course) => $course
                    ->where('is_popular', true)
                    ->has('category.icon')
                    ->etc())
                ->has('latestCourses', 8)
                ->where('latestCourses.0.title', 'Clinical Nutrition: Diet Planning for Chronic Conditions')
                ->has('instructors', 6)
                ->has('posts', 6));
    }

    public function test_unpublished_posts_are_hidden()
    {
        $this->seed(LandingSeeder::class);
        Post::query()->first()->update(['published_at' => now()->addDay()]);

        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page->has('posts', 5));
    }
}
