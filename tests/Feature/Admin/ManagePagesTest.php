<?php

namespace Tests\Feature\Admin;

use App\Models\Course;
use App\Models\Instructor;
use App\Models\Page;
use App\Models\Post;
use App\Models\User;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ManagePagesTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(LandingSeeder::class);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_the_built_in_pages_are_listed_with_their_site_addresses()
    {
        $this->actingAs($this->admin)
            ->get(route('admin.pages.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/pages/index')
                ->has('pages', 4)
                ->where('pages.0.kind', 'home')
                ->where('pages.1.url', route('about')));
    }

    public function test_built_in_wording_and_seo_are_saved_and_sent_to_the_page()
    {
        Storage::fake('public');
        $about = Page::firstWhere('slug', 'about-us');

        $this->actingAs($this->admin)->put(route('admin.pages.update', $about), [
            'content' => ['mission_title' => ' Why we teach ', 'values_title' => '', 'bad key!' => 'x'],
            'meta_title' => 'About our school',
            'og_image' => UploadedFile::fake()->image('share.jpg'),
            // Ignored for built-in pages.
            'title' => 'Renamed', 'body' => '<p>x</p>',
        ])->assertSessionHasNoErrors();

        $about->refresh();
        $this->assertSame(['mission_title' => 'Why we teach'], $about->content);
        $this->assertSame('About Us', $about->title);
        Storage::disk('public')->assertExists('pages/'.basename($about->og_image_url));

        $this->get(route('about'))->assertInertia(fn (Assert $page) => $page
            ->where('page.content.mission_title', 'Why we teach')
            ->where('page.meta_title', 'About our school'));

        $this->delete(route('admin.pages.destroy', $about))->assertForbidden();
    }

    public function test_custom_pages_are_created_published_hidden_as_drafts_and_deleted()
    {
        $this->actingAs($this->admin)->post(route('admin.pages.store'), [
            'title' => 'Refund Policy', 'body' => '<p>Refunds within 30 days.</p><script>x</script>', 'is_published' => false,
        ])->assertSessionHasNoErrors();

        $page = Page::firstWhere('slug', 'refund-policy');
        $this->assertSame('<p>Refunds within 30 days.</p>', $page->body);
        $this->get(route('pages.show', 'refund-policy'))->assertOk(); // admin preview

        auth()->logout();
        $this->get(route('pages.show', 'refund-policy'))->assertNotFound();
        $page->update(['is_published' => true]);
        $this->get(route('pages.show', 'refund-policy'))
            ->assertInertia(fn (Assert $inertia) => $inertia->component('page')->where('page.title', 'Refund Policy'));
        $this->get(route('pages.show', 'about-us'))->assertNotFound();

        $this->actingAs($this->admin)->post(route('admin.pages.store'), ['title' => 'Other', 'slug' => 'refund-policy', 'body' => '<p>x</p>'])
            ->assertSessionHasErrors('slug');
        $this->delete(route('admin.pages.destroy', $page));
        $this->assertModelMissing($page);
    }

    public function test_home_collections_pick_popular_courses_instructors_and_posts_in_order()
    {
        [$first, $second] = Course::orderBy('id')->take(2)->pluck('id')->all();
        [$instructorA, $instructorB] = Instructor::orderBy('id')->take(2)->pluck('id')->all();
        $post = Post::published()->oldest('published_at')->value('id');

        $this->actingAs($this->admin)->put(route('admin.collections.update'), [
            'courses' => [$second, $first], 'instructors' => [$instructorB, $instructorA], 'posts' => [$post],
        ])->assertSessionHasNoErrors();

        $this->assertEqualsCanonicalizing([$first, $second], Course::where('is_popular', true)->pluck('id')->all());
        $this->get(route('home'))->assertInertia(fn (Assert $page) => $page
            ->has('popularCourses', 2)
            ->has('instructors', 2)
            ->where('instructors.0.id', $instructorB)
            ->has('posts', 1)
            ->where('posts.0.id', $post));

        // Clearing the picks brings back the automatic lists.
        $this->put(route('admin.collections.update'), ['courses' => [$first], 'instructors' => [], 'posts' => []]);
        $this->get(route('home'))->assertInertia(fn (Assert $page) => $page
            ->has('instructors', Instructor::count())
            ->has('posts', min(6, Post::published()->count())));

        $this->put(route('admin.collections.update'), ['courses' => [], 'instructors' => [], 'posts' => range(1, 7)])->assertSessionHasErrors('posts');
    }

    public function test_students_cannot_manage_pages()
    {
        $this->actingAs(User::factory()->create())->get(route('admin.pages.index'))->assertForbidden();
        $this->get(route('admin.collections.index'))->assertForbidden();
    }
}
