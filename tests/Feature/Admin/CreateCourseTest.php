<?php

namespace Tests\Feature\Admin;

use App\Enums\CourseStatus;
use App\Models\Category;
use App\Models\Course;
use App\Models\Instructor;
use App\Models\User;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CreateCourseTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(LandingSeeder::class);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_the_form_lists_instructors_categories_and_languages()
    {
        $this->actingAs($this->admin)
            ->get(route('admin.courses.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/courses/create')
                ->has('instructors', Instructor::count())
                ->has('categories', Category::whereNull('parent_id')->count())
                ->has('categories.0.children')
                ->where('languages.en', 'English'));
    }

    public function test_students_cannot_open_or_submit_the_form()
    {
        $student = User::factory()->create();

        $this->actingAs($student)->get(route('admin.courses.create'))->assertForbidden();
        $this->actingAs($student)->post(route('admin.courses.store'), $this->validPayload())->assertForbidden();
    }

    public function test_a_discounted_course_is_saved_as_a_draft_with_a_clean_description_and_thumbnail()
    {
        Storage::fake('public');
        $category = Category::whereNull('parent_id')->where('is_default', false)->firstOrFail();
        $subcategory = Category::create(['name' => 'Ward Management', 'slug' => 'ward-management', 'parent_id' => $category->id, 'icon' => 'layout-grid']);

        $this->actingAs($this->admin)
            ->post(route('admin.courses.store'), $this->validPayload([
                'category_id' => $category->id,
                'subcategory_id' => $subcategory->id,
                'price' => '49.99',
                'discount' => true,
                'discount_price' => '29.99',
                'description' => '<p onclick="steal()">Hello <strong>world</strong></p><script>alert(1)</script>',
                'thumbnail' => UploadedFile::fake()->image('cover.jpg'),
            ]))
            ->assertRedirect(route('admin.courses.index'));

        $course = Course::where('title', 'Nursing Leadership Basics')->firstOrFail();

        $this->assertSame(CourseStatus::Draft, $course->status);
        $this->assertSame('nursing-leadership-basics', $course->slug);
        $this->assertSame($subcategory->id, $course->subcategory_id);
        $this->assertSame('29.99', $course->price);
        $this->assertSame('49.99', $course->compare_at_price);
        $this->assertSame('<p>Hello <strong>world</strong></p>', $course->description);
        $this->assertStringStartsWith('/storage/courses/', parse_url($course->image_url, PHP_URL_PATH));
        Storage::disk('public')->assertExists(str_replace('/storage/', '', parse_url($course->image_url, PHP_URL_PATH)));
    }

    public function test_a_free_course_ignores_the_price_and_a_repeated_title_gets_a_new_slug()
    {
        $this->actingAs($this->admin)->post(route('admin.courses.store'), $this->validPayload())->assertSessionHasNoErrors();
        $this->actingAs($this->admin)->post(route('admin.courses.store'), $this->validPayload([
            'pricing_type' => 'free',
            'price' => '10',
            'expiry_type' => 'limited_time',
            'expiry_months' => 6,
            'description' => '<p></p>',
        ]))->assertSessionHasNoErrors();

        $course = Course::where('slug', 'nursing-leadership-basics-2')->firstOrFail();

        $this->assertSame('0.00', $course->price);
        $this->assertNull($course->compare_at_price);
        $this->assertNull($course->description);
        $this->assertSame(6, $course->expiry_months);
    }

    public function test_validation_rejects_a_foreign_subcategory_and_a_discount_above_the_price()
    {
        [$first, $second] = Category::whereNull('parent_id')->where('is_default', false)->take(2)->get();
        $otherChild = Category::create(['name' => 'Elsewhere', 'slug' => 'elsewhere', 'parent_id' => $second->id, 'icon' => 'layout-grid']);

        $this->actingAs($this->admin)
            ->post(route('admin.courses.store'), $this->validPayload([
                'category_id' => $first->id,
                'subcategory_id' => $otherChild->id,
                'discount' => true,
                'discount_price' => '99',
                'expiry_type' => 'limited_time',
            ]))
            ->assertSessionHasErrors(['subcategory_id', 'discount_price', 'expiry_months']);

        $this->assertDatabaseMissing('courses', ['title' => 'Nursing Leadership Basics']);
    }

    public function test_editor_images_are_uploaded_to_public_storage()
    {
        Storage::fake('public');

        $url = $this->actingAs($this->admin)
            ->post(route('admin.courses.editor-images'), ['image' => UploadedFile::fake()->image('chart.png')])
            ->assertOk()
            ->json('url');

        Storage::disk('public')->assertExists(str_replace('/storage/', '', parse_url($url, PHP_URL_PATH)));

        $this->actingAs($this->admin)
            ->postJson(route('admin.courses.editor-images'), ['image' => UploadedFile::fake()->create('notes.pdf')])
            ->assertUnprocessable();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function validPayload(array $overrides = []): array
    {
        return [
            'title' => 'Nursing Leadership Basics',
            'short_description' => 'Lead a ward team with confidence.',
            'description' => '',
            'instructor_id' => Instructor::value('id'),
            'category_id' => Category::whereNull('parent_id')->value('id'),
            'subcategory_id' => '',
            'level' => 'beginner',
            'language' => 'en',
            'pricing_type' => 'paid',
            'price' => '19.99',
            'discount' => false,
            'discount_price' => '',
            'expiry_type' => 'lifetime',
            'expiry_months' => '',
            'drip_content' => '0',
            ...$overrides,
        ];
    }
}
