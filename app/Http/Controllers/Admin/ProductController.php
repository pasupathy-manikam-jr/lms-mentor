<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ProductStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Models\Category;
use App\Models\Instructor;
use App\Models\Product;
use App\Models\ProductAsset;
use App\Models\ProductInfoItem;
use App\Models\ProductOrder;
use App\Support\ContentOwner;
use App\Support\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The Store section, following the Mentor demo: Manage Products, Create Product, the product editor
 * (Basic, Pricing, Media & Files, Info, SEO) and Product Sales.
 */
class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(ProductStatus::class)],
            'per_page' => ['nullable', 'integer', 'in:10,20,50'],
        ]);

        $products = ContentOwner::scope(Product::query())
            ->with(['instructor:id,name,title', 'category:id,name'])
            ->withCount('orders')
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->whereLike('title', "%{$search}%"))
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->latest('id')
            ->paginate($filters['per_page'] ?? 10, ['id', 'instructor_id', 'category_id', 'title', 'slug', 'status', 'price'])
            ->withQueryString();

        return Inertia::render('admin/products/index', [
            'products' => $products,
            'filters' => $filters,
            'statuses' => array_column(ProductStatus::cases(), 'value'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/products/create', $this->formOptions());
    }

    /**
     * Save a new product as a draft and open its editor to add files.
     */
    public function store(StoreProductRequest $request, HtmlSanitizer $sanitizer): RedirectResponse
    {
        $product = Product::create([
            ...$this->attributesFrom($request, $sanitizer),
            'slug' => $this->uniqueSlug($request->validated('title')),
            'status' => ProductStatus::Draft,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Product created. Add its files next.')]);

        return to_route('admin.products.edit', $product);
    }

    public function edit(Product $product): Response
    {
        $isDiscounted = $product->compare_at_price !== null;
        $assets = $product->assets()->get();

        return Inertia::render('admin/products/edit', [
            ...$this->formOptions(),
            'status' => $product->status,
            'statuses' => array_column(ProductStatus::cases(), 'value'),
            'slug' => $product->slug,
            'gallery' => $assets->where('kind', 'image')->values()->map(fn (ProductAsset $asset) => [
                'id' => $asset->id, 'name' => $asset->name, 'url' => Storage::disk('public')->url($asset->path),
            ]),
            'files' => $assets->where('kind', 'file')->values()->map(fn (ProductAsset $asset) => $asset->only(['id', 'name', 'size'])),
            'info' => $product->infoItems()->get(['id', 'type', 'title', 'body'])->groupBy('type'),
            'product' => [
                'id' => $product->id,
                'title' => $product->title,
                'summary' => $product->summary ?? '',
                'description' => $product->makeVisible('description')->description ?? '',
                'instructor_id' => (string) ($product->instructor_id ?? ''),
                'category_id' => (string) $product->category_id,
                'type' => $product->type,
                'format' => $product->format ?? '',
                'pricing_type' => (float) $product->price > 0 || $isDiscounted ? 'paid' : 'free',
                'price' => $isDiscounted ? $product->compare_at_price : ((float) $product->price > 0 ? $product->price : ''),
                'discount' => $isDiscounted,
                'discount_price' => $isDiscounted ? $product->price : '',
                'unlimited_stock' => $product->stock === null,
                'stock' => (string) ($product->stock ?? ''),
                'image_url' => $product->image_url,
                ...collect(['meta_title', 'meta_keywords', 'meta_description', 'og_title', 'og_description'])
                    ->mapWithKeys(fn (string $field) => [$field => $product->{$field} ?? '']),
            ],
        ]);
    }

    public function update(StoreProductRequest $request, Product $product, HtmlSanitizer $sanitizer): RedirectResponse
    {
        $product->update($this->attributesFrom($request, $sanitizer, $product));

        return $this->done(__('Product updated.'));
    }

    public function updateStatus(Request $request, Product $product): RedirectResponse
    {
        $product->update($request->validate(['status' => ['required', Rule::enum(ProductStatus::class)]]));

        return $this->done(__('Product status updated.'));
    }

    /**
     * Products that have been sold are kept, so buyers keep their downloads; archive them instead.
     */
    public function destroy(Product $product): RedirectResponse
    {
        if ($product->orders()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('This product has orders, so it cannot be deleted. Archive it instead.')]);

            return back();
        }

        $this->deleteUpload($product->image_url);
        $product->delete();

        return $this->done(__('Product deleted.'));
    }

    /**
     * Add gallery images (up to 8, public) or downloadable files (up to 5, private, 50 MB each).
     */
    public function storeAssets(Request $request, Product $product): RedirectResponse
    {
        $kind = $request->validate(['kind' => ['required', Rule::in(['image', 'file'])]])['kind'];
        $limit = $kind === 'image' ? 8 : 5;
        $remaining = $limit - $product->assets()->where('kind', $kind)->count();

        $validated = $request->validate([
            'uploads' => ['required', 'array', 'min:1', "max:{$remaining}"],
            'uploads.*' => $kind === 'image'
                ? ['image', 'max:4096']
                : ['file', 'max:46080', 'mimes:pdf,zip,epub,docx,xlsx,pptx,csv,txt,mp3,mp4'],
        ], ['uploads.max' => __('You can add up to :limit.', ['limit' => $limit])]);

        foreach ($validated['uploads'] as $upload) {
            $product->assets()->create([
                'kind' => $kind,
                'name' => $upload->getClientOriginalName(),
                'path' => $upload->store("products/{$product->id}", $kind === 'image' ? 'public' : 'local'),
                'size' => $upload->getSize(),
            ]);
        }

        return $this->done($kind === 'image' ? __('Images added.') : __('Files added.'));
    }

    public function destroyAsset(Product $product, ProductAsset $asset): RedirectResponse
    {
        $asset->delete();

        return $this->done(__('Removed.'));
    }

    /**
     * Download a product file: open to admins and to buyers of the product.
     */
    public function downloadAsset(Request $request, Product $product, ProductAsset $asset): mixed
    {
        abort_unless($asset->kind === 'file', 404);
        abort_unless($request->user()->isAdmin() || $product->orders()->whereBelongsTo($request->user())->exists(), 403);

        return Storage::disk('local')->download($asset->path, $asset->name);
    }

    public function storeInfo(Request $request, Product $product): RedirectResponse
    {
        $validated = $this->validatedInfo($request);

        $product->infoItems()->create([
            ...$validated,
            'position' => (int) $product->infoItems()->where('type', $validated['type'])->max('position') + 1,
        ]);

        return $this->done(__('Saved.'));
    }

    public function updateInfo(Request $request, Product $product, ProductInfoItem $infoItem): RedirectResponse
    {
        $infoItem->update(Arr::except($this->validatedInfo($request), 'type'));

        return $this->done(__('Saved.'));
    }

    public function destroyInfo(Product $product, ProductInfoItem $infoItem): RedirectResponse
    {
        $infoItem->delete();

        return $this->done(__('Removed.'));
    }

    /**
     * Product Sales: every order, newest first.
     */
    public function sales(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'in:10,20,50'],
        ]);

        $orders = ProductOrder::query()
            ->when(ContentOwner::instructorId(), fn ($query, $id) => $query->whereRelation('product', 'instructor_id', $id))
            ->with(['user:id,name,email', 'product:id,title'])
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query
                ->whereHas('user', fn ($query) => $query->whereLike('name', "%{$search}%")->orWhereLike('email', "%{$search}%"))
                ->orWhereHas('product', fn ($query) => $query->whereLike('title', "%{$search}%"))))
            ->latest()
            ->latest('id')
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString()
            ->through(fn (ProductOrder $order) => [
                ...$order->only(['id', 'subtotal', 'discount', 'tax', 'total']),
                'user' => $order->user->only(['id', 'name', 'email']),
                'product' => $order->product->only(['id', 'title']),
                'ordered_at' => $order->created_at->toIso8601String(),
            ]);

        return Inertia::render('admin/products/sales', ['orders' => $orders, 'filters' => $filters]);
    }

    /**
     * @return array{type: string, title: string, body: string}
     */
    private function validatedInfo(Request $request): array
    {
        return $request->validate([
            'type' => ['required', Rule::in(['specification', 'faq'])],
            'title' => ['required', 'string', 'max:500'],
            'body' => ['required', 'string', 'max:5000'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            // Instructors can only put their own name on it.
            'instructors' => Instructor::approved()->when(ContentOwner::instructorId(), fn ($query, $id) => $query->whereKey($id))->orderBy('name')->get(['id', 'name', 'title']),
            'categories' => Category::whereNull('parent_id')->orderBy('position')->get(['id', 'name']),
            'types' => Product::distinct()->orderBy('type')->pluck('type'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function attributesFrom(StoreProductRequest $request, HtmlSanitizer $sanitizer, ?Product $product = null): array
    {
        $validated = $request->validated();
        $isPaid = $validated['pricing_type'] === 'paid';
        $isDiscounted = $isPaid && $request->boolean('discount');
        $attributes = [
            ...Arr::only($validated, ['title', 'summary', 'instructor_id', 'category_id', 'type', 'meta_title', 'meta_keywords', 'meta_description', 'og_title', 'og_description']),
            'instructor_id' => ContentOwner::instructorId() ?? $validated['instructor_id'],
            'format' => $validated['format'] ?? '',
            'description' => $sanitizer->clean($validated['description'] ?? null),
            'price' => $isPaid ? ($isDiscounted ? $validated['discount_price'] : $validated['price']) : 0,
            'compare_at_price' => $isDiscounted ? $validated['price'] : null,
            'stock' => $request->boolean('unlimited_stock') ? null : $validated['stock'],
        ];

        if ($request->hasFile('thumbnail')) {
            $attributes['image_url'] = Storage::disk('public')->url($request->file('thumbnail')->store('products', 'public'));
        } elseif ($request->boolean('remove_thumbnail') || ! $product) {
            $attributes['image_url'] = null;
        }

        if ($product && array_key_exists('image_url', $attributes)) {
            $this->deleteUpload($product->image_url);
        }

        return $attributes;
    }

    /**
     * Delete a file this app uploaded to the public disk; bundled images are kept.
     */
    private function deleteUpload(?string $url): void
    {
        $prefix = Storage::disk('public')->url('');

        if ($url && str_starts_with($url, $prefix)) {
            Storage::disk('public')->delete(substr($url, strlen($prefix)));
        }
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'product';
        $slug = $base;

        for ($i = 2; Product::where('slug', $slug)->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }

    private function done(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
