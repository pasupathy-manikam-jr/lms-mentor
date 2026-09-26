<?php

namespace App\Http\Controllers;

use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Show the store, filtered by search, category and price, and sorted (newest first by default).
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'exists:categories,slug'],
            'price' => ['nullable', 'in:free,paid'],
            'sort' => ['nullable', 'in:price_high,price_low,bestsellers,top_rated'],
        ]);

        $products = Product::published()->with(['category:id,icon', 'instructor:id,name'])
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->whereLike('title', "%{$search}%"))
            ->when($filters['category'] ?? null, fn ($query, $slug) => $query->whereRelation('category', 'slug', $slug))
            ->when(($filters['price'] ?? null) === 'free', fn ($query) => $query->where('price', 0))
            ->when(($filters['price'] ?? null) === 'paid', fn ($query) => $query->where('price', '>', 0))
            ->when(match ($filters['sort'] ?? null) {
                'price_high' => ['price', 'desc'],
                'price_low' => ['price', 'asc'],
                'bestsellers' => ['sales_count', 'desc'],
                'top_rated' => ['rating', 'desc'],
                default => null,
            }, fn ($query, $order) => $query->orderBy(...$order))
            ->latest('id')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('store/index', [
            'products' => $products,
            'categories' => Category::listedFor('products', 'published'),
            'filters' => $filters,
        ]);
    }

    /**
     * Show one product with a few others from the same category.
     */
    public function show(Request $request, Product $product): Response
    {
        abort_unless($product->status === ProductStatus::Published || $request->user()?->isAdmin(), 404);

        return Inertia::render('store/show', [
            // owned, pending (offline payment awaiting approval) or null.
            'ownership' => $ownership = ($request->user() ? Payment::ownership($request->user(), $product) : null),
            // Buyers (and admins) see the downloadable files.
            'files' => $ownership === 'owned' || $request->user()?->isAdmin()
                ? $product->assets()->where('kind', 'file')->get(['id', 'name', 'size'])
                : [],
            'product' => $product->load(['category', 'instructor'])->makeVisible('description'),
            'gallery' => $product->assets()->where('kind', 'image')->get()->map(fn ($image) => Storage::disk('public')->url($image->path)),
            'info' => $product->infoItems()->get(['id', 'type', 'title', 'body'])->groupBy('type'),
            'relatedProducts' => Product::published()->with(['category:id,icon', 'instructor:id,name'])
                ->whereBelongsTo($product->category)
                ->whereKeyNot($product->id)
                ->latest('id')
                ->take(3)
                ->get(),
            'categories' => Category::listedFor('products', 'published'),
        ]);
    }
}
