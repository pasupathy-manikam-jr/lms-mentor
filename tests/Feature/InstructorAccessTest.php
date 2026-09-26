<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Instructor;
use App\Models\Media;
use App\Models\PayoutRequest;
use App\Models\Post;
use App\Models\User;
use Database\Seeders\LandingSeeder;
use Database\Seeders\ProductSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InstructorAccessTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Instructor $instructor;

    private Course $own;

    private Course $other;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([LandingSeeder::class, ProductSeeder::class]);
        $this->instructor = Instructor::whereHas('courses')->orderBy('id')->firstOrFail();
        $this->user = User::factory()->create();
        $this->user->assignRole(UserRole::Instructor->value);
        $this->instructor->update(['user_id' => $this->user->id, 'status' => 'approved']);
        $this->own = $this->instructor->courses()->firstOrFail();
        $this->other = Course::where('instructor_id', '!=', $this->instructor->id)->firstOrFail();
    }

    public function test_instructors_see_and_edit_only_their_own_courses()
    {
        $this->actingAs($this->user)->get(route('admin.courses.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('courses.total', $this->instructor->courses()->count())
                ->where('statuses', fn ($statuses) => ! collect($statuses)->contains('approved')));

        $this->get(route('admin.courses.edit', $this->own))->assertOk();
        $this->get(route('admin.courses.edit', $this->other))->assertNotFound();
        $this->put(route('admin.courses.update', $this->other), [])->assertNotFound();
        $this->post(route('admin.courses.sections.store', $this->other), ['title' => 'x'])->assertNotFound();

        // They submit for review; publishing is for admins.
        $this->patch(route('admin.courses.status', $this->own), ['status' => 'approved'])->assertSessionHasErrors('status');
        $this->patch(route('admin.courses.status', $this->own), ['status' => 'pending'])->assertSessionHasNoErrors();
    }

    public function test_a_course_an_instructor_creates_is_always_theirs()
    {
        $this->actingAs($this->user)->post(route('admin.courses.store'), [
            'title' => 'Ward Rounds', 'short_description' => 'x', 'description' => '', 'instructor_id' => $this->other->instructor_id,
            'category_id' => Category::whereNull('parent_id')->value('id'), 'subcategory_id' => '', 'level' => 'beginner', 'language' => 'en',
            'pricing_type' => 'free', 'price' => '', 'discount' => false, 'discount_price' => '', 'expiry_type' => 'lifetime', 'expiry_months' => '', 'drip_content' => '0',
        ])->assertSessionHasNoErrors();

        $this->assertSame($this->instructor->id, Course::firstWhere('title', 'Ward Rounds')->instructor_id);
        $this->get(route('admin.courses.create'))->assertInertia(fn (Assert $page) => $page->has('instructors', 1)->where('instructors.0.id', $this->instructor->id));
    }

    public function test_enrolments_and_sales_are_limited_and_admin_pages_stay_closed()
    {
        $student = User::factory()->create();
        Enrollment::create(['user_id' => $student->id, 'course_id' => $this->own->id, 'price_paid' => 10]);
        Enrollment::create(['user_id' => $student->id, 'course_id' => $this->other->id, 'price_paid' => 10]);

        $this->actingAs($this->user)->get(route('admin.course-enrollments.index'))
            ->assertInertia(fn (Assert $page) => $page->where('enrollments.total', 1)->where('canManage', false)->where('users', []));
        $this->post(route('admin.course-enrollments.store'), ['user_id' => $student->id, 'item_id' => $this->own->id, 'enrollment_type' => 'free'])->assertForbidden();

        foreach (['admin.course-categories.index', 'admin.course-coupons.index', 'admin.users.index', 'admin.billing.gateways', 'admin.settings.show'] as $route) {
            $this->get(route($route, $route === 'admin.settings.show' ? 'system' : []))->assertForbidden("{$route} should be admin-only");
        }

        // Unapproved instructors get nothing.
        $this->instructor->update(['status' => 'pending']);
        $this->get(route('admin.courses.index'))->assertForbidden();
    }

    public function test_posts_and_media_belong_to_whoever_created_them()
    {
        Storage::fake('public');
        $theirs = Post::orderBy('id')->firstOrFail();

        $this->actingAs($this->user)->post(route('admin.blogs.store'), [
            'title' => 'My notes', 'category_id' => Category::whereNull('parent_id')->value('id'), 'status' => 'draft', 'body' => '<p>Hi</p>',
        ])->assertSessionHasNoErrors();
        $this->get(route('admin.blogs.index'))->assertInertia(fn (Assert $page) => $page->where('posts.total', 1)->where('posts.data.0.title', 'My notes'));
        $this->get(route('admin.blogs.edit', $theirs))->assertNotFound();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->post(route('admin.media.store'), ['files' => [UploadedFile::fake()->image('admin.png')]]);
        $this->actingAs($this->user)->post(route('admin.media.store'), ['files' => [UploadedFile::fake()->image('mine.png')]]);
        $this->get(route('admin.media.index'))->assertInertia(fn (Assert $page) => $page->where('media.total', 1)->where('media.data.0.name', 'mine'));

        $adminFile = Media::firstWhere('name', 'admin');
        $this->delete(route('admin.media.destroy'), ['ids' => [$adminFile->id]]);
        $this->assertModelExists($adminFile);
        $this->post(route('admin.media.folders.store'), ['name' => 'X'])->assertForbidden();
    }

    public function test_instructors_request_withdrawals_up_to_their_earnings()
    {
        $student = User::factory()->create();
        Enrollment::create(['user_id' => $student->id, 'course_id' => $this->own->id, 'price_paid' => 100]);
        $this->actingAs($this->user);

        // 70% share of $100.
        $this->get(route('instructor.payouts.index'))->assertInertia(fn (Assert $page) => $page->where('balance.available', 70));
        $this->post(route('instructor.payouts.store'), ['amount' => 50])->assertSessionHasErrors('amount'); // no payout details yet

        $this->put(route('instructor.payouts.settings.update'), ['payout_details' => 'Maybank 1234'])->assertSessionHasNoErrors();
        $this->post(route('instructor.payouts.store'), ['amount' => 80])->assertSessionHasErrors('amount');
        $this->post(route('instructor.payouts.store'), ['amount' => 50])->assertSessionHasNoErrors();
        $this->post(route('instructor.payouts.store'), ['amount' => 10])->assertSessionHasErrors('amount'); // one pending at a time

        $this->assertSame('50.00', PayoutRequest::sole()->amount);
        $this->get(route('instructor.payouts.index'))->assertInertia(fn (Assert $page) => $page->where('balance.available', 20));

        $this->actingAs(User::factory()->create())->get(route('instructor.payouts.index'))->assertForbidden();
    }
}
