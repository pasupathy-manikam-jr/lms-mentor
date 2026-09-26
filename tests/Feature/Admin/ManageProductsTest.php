<?php

namespace Tests\Feature\Admin;

use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Instructor;
use App\Models\Product;
use App\Models\ProductOrder;
use App\Models\User;
use Database\Seeders\LandingSeeder;
use Database\Seeders\ProductSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ManageProductsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([LandingSeeder::class, ProductSeeder::class]);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_the_product_list_searches_and_filters_by_status()
    {
        Product::orderBy('id')->first()->update(['status' => ProductStatus::Draft]);

        $this->actingAs($this->admin)
            ->get(route('admin.products.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/products/index')->where('products.total', 9));

        $this->get(route('admin.products.index', ['status' => 'draft']))
            ->assertInertia(fn (Assert $page) => $page->where('products.total', 1));
        $this->get(route('admin.products.index', ['search' => 'yoga']))
            ->assertInertia(fn (Assert $page) => $page->where('products.total', 1));
    }

    public function test_a_product_is_created_as_a_draft_edited_and_published()
    {
        $this->actingAs($this->admin)
            ->post(route('admin.products.store'), $this->payload())
            ->assertSessionHasNoErrors();

        $product = Product::where('title', 'Ward Round Checklist')->firstOrFail();
        $this->assertSame(ProductStatus::Draft, $product->status);
        $this->assertNull($product->stock);

        $this->get(route('store.show', $product->slug))->assertOk(); // admin preview
        $this->get(route('admin.products.edit', $product))
            ->assertInertia(fn (Assert $page) => $page->component('admin/products/edit')->where('product.title', 'Ward Round Checklist'));

        $this->put(route('admin.products.update', $product), $this->payload([
            'pricing_type' => 'paid', 'price' => 20, 'discount' => true, 'discount_price' => 15,
            'unlimited_stock' => false, 'stock' => 40, 'description' => '<p>Hi</p><script>alert(1)</script>',
        ]))->assertSessionHasNoErrors();
        $product->refresh();
        $this->assertSame(['15.00', '20.00', 40, '<p>Hi</p>'], [$product->price, $product->compare_at_price, $product->stock, $product->description]);

        $this->patch(route('admin.products.status', $product), ['status' => 'published']);
        $this->assertSame(ProductStatus::Published, $product->refresh()->status);
    }

    public function test_only_published_products_are_public_and_sold_products_cannot_be_deleted()
    {
        [$draft, $sold] = Product::orderBy('id')->take(2)->get();
        $draft->update(['status' => ProductStatus::Draft]);
        ProductOrder::create(['user_id' => $this->admin->id, 'product_id' => $sold->id, 'subtotal' => 5, 'discount' => 0, 'tax' => 0, 'total' => 5]);

        $this->get(route('store.show', $draft->slug))->assertNotFound();
        $this->get(route('store.index'))->assertInertia(fn (Assert $page) => $page->where('products.total', 8));

        $this->actingAs($this->admin);
        $this->delete(route('admin.products.destroy', $sold));
        $this->assertModelExists($sold);
        $this->delete(route('admin.products.destroy', $draft));
        $this->assertModelMissing($draft);

        $this->get(route('admin.products.sales', ['search' => $sold->title]))
            ->assertInertia(fn (Assert $page) => $page->component('admin/products/sales')->where('orders.total', 1)->where('orders.data.0.total', '5.00'));
    }

    public function test_gallery_images_and_files_are_limited_stored_gated_and_cleaned_up()
    {
        Storage::fake('public');
        Storage::fake('local');
        $product = Product::orderBy('id')->firstOrFail();
        $this->actingAs($this->admin);

        $this->post(route('admin.products.assets.store', $product), ['kind' => 'file', 'uploads' => [UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf')]])
            ->assertSessionHasNoErrors();
        $this->post(route('admin.products.assets.store', $product), ['kind' => 'image', 'uploads' => array_map(fn ($i) => UploadedFile::fake()->image("p{$i}.jpg"), range(1, 9))])
            ->assertSessionHasErrors('uploads');
        $this->post(route('admin.products.assets.store', $product), ['kind' => 'file', 'uploads' => [UploadedFile::fake()->create('run.exe', 10)]])
            ->assertSessionHasErrors('uploads.0');

        $file = $product->assets()->firstOrFail();
        Storage::disk('local')->assertExists($file->path);

        // Only admins and buyers can download.
        $this->get(route('store.files.download', [$product->slug, $file]))->assertOk();
        $buyer = User::factory()->create();
        $this->actingAs($buyer)->get(route('store.files.download', [$product->slug, $file]))->assertForbidden();
        ProductOrder::create(['user_id' => $buyer->id, 'product_id' => $product->id, 'subtotal' => 0, 'discount' => 0, 'tax' => 0, 'total' => 0]);
        $this->get(route('store.files.download', [$product->slug, $file]))->assertOk();

        $this->actingAs($this->admin)->delete(route('admin.products.assets.destroy', [$product, $file]));
        Storage::disk('local')->assertMissing($file->path);
    }

    public function test_specifications_and_faqs_are_managed_and_shown_on_the_store_page()
    {
        $product = Product::orderBy('id')->firstOrFail();
        $product->infoItems()->delete();
        $this->actingAs($this->admin);

        $this->post(route('admin.products.info.store', $product), ['type' => 'specification', 'title' => 'Pages', 'body' => '220'])->assertSessionHasNoErrors();
        $this->post(route('admin.products.info.store', $product), ['type' => 'faq', 'title' => 'Printable?', 'body' => 'Yes'])->assertSessionHasNoErrors();
        $spec = $product->infoItems()->where('type', 'specification')->firstOrFail();
        $this->put(route('admin.products.info.update', [$product, $spec]), ['type' => 'specification', 'title' => 'Pages', 'body' => '240']);

        $this->get(route('store.show', $product->slug))
            ->assertInertia(fn (Assert $page) => $page
                ->where('info.specification.0.body', '240')
                ->where('info.faq.0.title', 'Printable?'));

        $this->delete(route('admin.products.info.destroy', [$product, $spec]));
        $this->assertModelMissing($spec);
    }

    public function test_students_cannot_manage_products()
    {
        $this->actingAs(User::factory()->create())->get(route('admin.products.index'))->assertForbidden();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'title' => 'Ward Round Checklist', 'summary' => 'A one-page checklist.', 'description' => '<p>Body</p>',
            'instructor_id' => Instructor::value('id'), 'category_id' => Category::whereNull('parent_id')->value('id'),
            'type' => 'Template', 'format' => 'PDF', 'pricing_type' => 'free', 'unlimited_stock' => true,
            ...$overrides,
        ];
    }
}
