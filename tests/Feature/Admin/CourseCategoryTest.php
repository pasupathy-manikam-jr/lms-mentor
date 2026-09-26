<?php

namespace Tests\Feature\Admin;

use App\Models\Category;
use App\Models\Course;
use App\Models\Exam;
use App\Models\Post;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\ExamSeeder;
use Database\Seeders\LandingSeeder;
use Database\Seeders\ProductSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CourseCategoryTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([LandingSeeder::class, ExamSeeder::class, ProductSeeder::class]);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_admins_see_the_default_category_first_then_the_rest_with_subcategories()
    {
        $ayurveda = Category::where('slug', 'ayurveda')->firstOrFail();
        Category::create(['parent_id' => $ayurveda->id, 'name' => 'Panchakarma', 'slug' => 'panchakarma', 'icon' => 'leaf']);

        $this->actingAs($this->admin)
            ->get(route('admin.course-categories.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/course-categories/index')
                ->has('categories', 9)
                ->where('categories.0.is_default', true)
                ->where('categories.5.slug', 'ayurveda')
                ->where('categories.5.children.0.name', 'Panchakarma'));
    }

    public function test_adding_a_category_and_a_subcategory()
    {
        $this->actingAs($this->admin)
            ->post(route('admin.course-categories.store'), ['name' => 'Unani Medicine', 'icon' => 'leaf'])
            ->assertRedirect();

        $unani = Category::where('slug', 'unani-medicine')->firstOrFail();
        $this->assertNull($unani->parent_id);

        $this->actingAs($this->admin)
            ->post(route('admin.course-categories.store'), ['name' => 'Ilaj bil Tadbeer', 'icon' => 'activity', 'parent_id' => $unani->id])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertSame($unani->id, Category::where('slug', 'ilaj-bil-tadbeer')->value('parent_id'));
    }

    public function test_subcategories_cannot_be_nested_or_placed_under_default()
    {
        $default = Category::where('is_default', true)->firstOrFail();
        $child = Category::create(['parent_id' => Category::where('slug', 'ayurveda')->value('id'), 'name' => 'Rasayana', 'slug' => 'rasayana', 'icon' => 'leaf']);

        foreach ([$default->id, $child->id] as $parentId) {
            $this->actingAs($this->admin)
                ->post(route('admin.course-categories.store'), ['name' => 'Nested', 'icon' => 'leaf', 'parent_id' => $parentId])
                ->assertSessionHasErrors('parent_id');
        }
    }

    public function test_the_default_category_cannot_be_edited_or_deleted()
    {
        $default = Category::where('is_default', true)->firstOrFail();

        $this->actingAs($this->admin)->put(route('admin.course-categories.update', $default), ['name' => 'Other', 'icon' => 'leaf'])->assertForbidden();
        $this->actingAs($this->admin)->delete(route('admin.course-categories.destroy', $default))->assertForbidden();
    }

    public function test_renaming_a_category_updates_its_slug()
    {
        $category = Category::where('slug', 'pharmacology')->firstOrFail();

        $this->actingAs($this->admin)
            ->put(route('admin.course-categories.update', $category), ['name' => 'Clinical Pharmacology', 'icon' => 'syringe'])
            ->assertRedirect();

        $this->assertSame('clinical-pharmacology', $category->fresh()->slug);
        $this->assertSame('syringe', $category->fresh()->icon);
    }

    public function test_deleting_a_category_moves_all_its_content_to_default()
    {
        $category = Category::where('slug', 'ayurveda')->firstOrFail();
        $default = Category::where('is_default', true)->firstOrFail();
        $counts = [
            Course::class => Course::where('category_id', $category->id)->count(),
            Exam::class => Exam::where('category_id', $category->id)->count(),
            Product::class => Product::where('category_id', $category->id)->count(),
            Post::class => Post::where('category_id', $category->id)->count(),
        ];

        $this->actingAs($this->admin)
            ->delete(route('admin.course-categories.destroy', $category))
            ->assertRedirect();

        $this->assertModelMissing($category);
        foreach ($counts as $model => $count) {
            $this->assertGreaterThan(0, $count, $model);
            $this->assertSame($count, $model::where('category_id', $default->id)->count(), $model);
        }

        // The public catalog now lists Default, because it holds courses.
        $this->get(route('courses.index'))
            ->assertInertia(fn (Assert $page) => $page->where('categories.0.slug', 'default'));
    }

    public function test_sorting_changes_the_public_order()
    {
        $ids = Category::whereNull('parent_id')->where('is_default', false)->orderByDesc('id')->pluck('id')->all();

        $this->actingAs($this->admin)
            ->put(route('admin.course-categories.sort'), ['ids' => $ids])
            ->assertRedirect();

        $this->get(route('courses.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('categories.0.id', $ids[0])
                // The empty Default category stays hidden from the public.
                ->has('categories', 8));
    }

    public function test_non_admins_cannot_manage_categories()
    {
        $student = User::factory()->create();

        $this->actingAs($student)->get(route('admin.course-categories.index'))->assertForbidden();
        $this->actingAs($student)->post(route('admin.course-categories.store'), ['name' => 'X', 'icon' => 'leaf'])->assertForbidden();
    }
}
