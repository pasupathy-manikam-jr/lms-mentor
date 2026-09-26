<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Post;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    /**
     * List published posts, newest first, filtered by search and category.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'exists:categories,slug'],
        ]);

        return Inertia::render('blog/index', [
            'posts' => Post::published()
                ->when($filters['search'] ?? null, fn ($query, $search) => $query->whereLike('title', "%{$search}%"))
                ->when($filters['category'] ?? null, fn ($query, $slug) => $query->whereRelation('category', 'slug', $slug))
                ->latest('published_at')
                ->paginate(9, ['id', 'category_id', 'title', 'slug', 'image_url', 'author_name', 'read_minutes', 'published_at'])
                ->withQueryString(),
            'categories' => $this->categories(),
            'filters' => $filters,
        ]);
    }

    /**
     * Show one published post with a few more from the same category. Unpublished posts return 404.
     */
    public function show(string $slug): Response
    {
        $post = Post::published()->where('slug', $slug)->with('category')->firstOrFail();

        return Inertia::render('blog/show', [
            'post' => $post,
            'relatedPosts' => Post::published()
                ->where('category_id', $post->category_id)
                ->whereKeyNot($post->id)
                ->latest('published_at')
                ->take(3)
                ->get(),
            'categories' => $this->categories(),
        ]);
    }

    /**
     * Sidebar categories with their published post counts.
     *
     * @return Collection<int, Category>
     */
    private function categories(): Collection
    {
        return Category::listedFor('posts', fn ($query) => $query->published());
    }
}
