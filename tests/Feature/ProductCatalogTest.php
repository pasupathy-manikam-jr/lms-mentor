<?php

namespace Tests\Feature;

use Database\Seeders\LandingSeeder;
use Database\Seeders\ProductSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProductCatalogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([LandingSeeder::class, ProductSeeder::class]);
    }

    public function test_store_lists_products_with_category_counts()
    {
        $this->get(route('store.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/index')
                ->where('products.total', 9)
                ->has('products.data.0.instructor.name')
                ->where('categories.4.items_count', 2));
    }

    public function test_store_filters_by_price_and_sorts()
    {
        $this->get(route('store.index', ['price' => 'free']))
            ->assertInertia(fn (Assert $page) => $page->where('products.total', 2));

        $this->get(route('store.index', ['sort' => 'price_high']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('products.data.0.title', 'Hospital Quality Audit Toolkit'));

        $this->get(route('store.index', ['sort' => 'bestsellers']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('products.data.0.title', 'Dosha Assessment Worksheets'));
    }

    public function test_store_rejects_unknown_sort()
    {
        $this->get(route('store.index', ['sort' => 'id; drop table']))
            ->assertSessionHasErrors('sort');
    }

    public function test_product_page_shows_the_product_and_author()
    {
        $this->get(route('store.show', 'pharmacology-drug-flashcards'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/show')
                ->where('product.type', 'Flashcards')
                ->where('product.image_url', asset('images/courses/clinical-pharmacology-basics.webp'))
                ->where('product.instructor.name', 'Dr. Marcus Bell')
                ->where('product.category.slug', 'pharmacology'));
    }

    public function test_unknown_product_returns_not_found()
    {
        $this->get('/store/no-such-product')->assertNotFound();
    }
}
