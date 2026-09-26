<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ManageBlogsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(LandingSeeder::class);
        $this->admin = User::factory()->admin()->create(['name' => 'Site Admin']);
    }

    public function test_the_blog_list_searches_posts_including_drafts()
    {
        Post::orderBy('id')->first()->update(['published_at' => null]);

        $this->actingAs($this->admin)
            ->get(route('admin.blogs.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/blogs/index')->where('posts.total', 6));

        $this->get(route('admin.blogs.index', ['search' => 'manager']))
            ->assertInertia(fn (Assert $page) => $page->where('posts.total', 1));
    }

    public function test_a_draft_is_created_then_published_with_its_excerpt_and_reading_time_worked_out()
    {
        Storage::fake('public');
        $this->actingAs($this->admin)
            ->post(route('admin.blogs.store'), $this->payload(['banner' => UploadedFile::fake()->image('banner.jpg')]))
            ->assertRedirect(route('admin.blogs.index'));

        $post = Post::where('slug', 'caring-for-your-gut')->firstOrFail();
        $this->assertNull($post->published_at);
        $this->assertSame('Site Admin', $post->author_name);
        $this->assertSame('<h2>Why it matters</h2><p>Fibre feeds good bacteria.</p>', $post->body);
        $this->assertSame('Why it matters Fibre feeds good bacteria.', $post->excerpt);
        $this->assertSame(1, $post->read_minutes);
        Storage::disk('public')->assertExists('posts/'.basename($post->banner_url));
        $this->get(route('blog.show', $post->slug))->assertNotFound();

        $this->put(route('admin.blogs.update', $post), $this->payload(['status' => 'published', 'remove_banner' => true]))->assertSessionHasNoErrors();
        $post->refresh();
        $this->assertNotNull($post->published_at);
        $this->assertNull($post->banner_url);
        $this->assertCount(0, Storage::disk('public')->files('posts'));
        $this->get(route('blog.show', $post->slug))->assertOk();
    }

    public function test_the_body_and_category_are_required_and_posts_can_be_deleted()
    {
        $this->actingAs($this->admin)
            ->post(route('admin.blogs.store'), $this->payload(['body' => '', 'category_id' => null]))
            ->assertSessionHasErrors(['body', 'category_id']);

        $post = Post::orderBy('id')->firstOrFail();
        $this->delete(route('admin.blogs.destroy', $post));
        $this->assertModelMissing($post);
    }

    public function test_students_cannot_manage_blogs()
    {
        $this->actingAs(User::factory()->create())->get(route('admin.blogs.index'))->assertForbidden();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'title' => 'Caring for Your Gut', 'category_id' => Category::whereNull('parent_id')->value('id'), 'status' => 'draft',
            'keywords' => 'gut, fibre', 'body' => '<h2>Why it matters</h2><p>Fibre feeds good bacteria.</p><script>x</script>',
            ...$overrides,
        ];
    }
}
