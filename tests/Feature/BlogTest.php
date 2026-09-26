<?php

namespace Tests\Feature;

use App\Models\Post;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BlogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(LandingSeeder::class);
    }

    public function test_blog_lists_published_posts_newest_first_with_category_counts()
    {
        Post::where('slug', 'how-to-build-a-study-habit-that-sticks')->update(['published_at' => now()->addDay()]);

        $this->get(route('blog.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('blog/index')
                ->where('posts.total', 5)
                ->where('posts.data.0.slug', 'understanding-your-prakriti-a-beginners-guide')
                ->where('categories.2.items_count', 0));
    }

    public function test_blog_filters_by_category_and_search()
    {
        $this->get(route('blog.index', ['category' => 'siddha-medicine']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('posts.total', 1)
                ->where('posts.data.0.slug', 'siddha-and-ayurveda-how-the-two-traditions-differ'));

        $this->get(route('blog.index', ['search' => 'manager']))
            ->assertInertia(fn (Assert $page) => $page->where('posts.total', 1));
    }

    public function test_post_page_shows_the_body_and_hides_unpublished_posts()
    {
        $this->get(route('blog.show', 'what-makes-a-great-hospital-administrator'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('blog/show')
                ->where('post.author_name', 'Dr. Tom Okafor')
                ->where('post.category.slug', 'healthcare-management')
                ->has('post.body'));

        Post::where('slug', 'what-makes-a-great-hospital-administrator')->update(['published_at' => null]);

        $this->get(route('blog.show', 'what-makes-a-great-hospital-administrator'))->assertNotFound();
    }
}
