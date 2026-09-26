<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBlogRequest;
use App\Models\Category;
use App\Models\Post;
use App\Support\ContentOwner;
use App\Support\HtmlSanitizer;
use App\Support\PublicUpload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The Blogs section, following the Mentor demo: Manage Blog, Create Blog and Update Blog. A post is
 * published when it has a publish date; the excerpt and reading time are worked out from the body.
 */
class BlogController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'in:10,20,50'],
        ]);

        $posts = Post::query()
            // Instructors see only their own posts.
            ->when(ContentOwner::isInstructor(), fn ($query) => $query->where('user_id', $request->user()->id))
            ->with('category:id,name')
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->whereLike('title', "%{$search}%"))
            ->latest('id')
            ->paginate($filters['per_page'] ?? 10, ['id', 'category_id', 'title', 'slug', 'author_name', 'published_at'])
            ->withQueryString();

        return Inertia::render('admin/blogs/index', ['posts' => $posts, 'filters' => $filters]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/blogs/form', ['post' => null, 'categories' => $this->categories()]);
    }

    public function store(StoreBlogRequest $request, HtmlSanitizer $sanitizer): RedirectResponse
    {
        Post::create([
            ...$this->attributesFrom($request, $sanitizer),
            'slug' => $this->uniqueSlug($request->validated('title')),
            'user_id' => $request->user()->id,
            'author_name' => $request->user()->name,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Blog created.')]);

        return to_route('admin.blogs.index');
    }

    public function edit(Post $post): Response
    {
        return Inertia::render('admin/blogs/form', [
            'post' => [
                ...$post->only(['id', 'title', 'slug', 'keywords', 'body', 'image_url', 'banner_url']),
                'category_id' => (string) $post->category_id,
                'status' => $post->published_at ? 'published' : 'draft',
            ],
            'categories' => $this->categories(),
        ]);
    }

    public function update(StoreBlogRequest $request, Post $post, HtmlSanitizer $sanitizer): RedirectResponse
    {
        $post->update($this->attributesFrom($request, $sanitizer, $post));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Blog updated.')]);

        return back();
    }

    public function destroy(Post $post): RedirectResponse
    {
        $this->deleteUpload($post->image_url);
        $this->deleteUpload($post->banner_url);
        $post->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Blog deleted.')]);

        return back();
    }

    /**
     * @return Collection<int, Category>
     */
    private function categories(): Collection
    {
        return Category::whereNull('parent_id')->orderBy('position')->get(['id', 'name']);
    }

    /**
     * @return array<string, mixed>
     */
    private function attributesFrom(StoreBlogRequest $request, HtmlSanitizer $sanitizer, ?Post $post = null): array
    {
        $validated = $request->validated();
        $body = $sanitizer->clean($validated['body']);
        $text = trim(preg_replace('/\s+/', ' ', html_entity_decode(strip_tags(str_replace('<', ' <', (string) $body)))));
        $isPublished = $validated['status'] === 'published';

        $attributes = [
            'title' => $validated['title'],
            'category_id' => $validated['category_id'],
            'keywords' => $validated['keywords'] ?? null,
            'body' => $body,
            'excerpt' => Str::limit($text, 200),
            'read_minutes' => max(1, (int) ceil(str_word_count($text) / 200)),
            // Keep the original date when an already published post is saved again.
            'published_at' => $isPublished ? ($post->published_at ?? now()) : null,
        ];

        foreach (['thumbnail' => 'image_url', 'banner' => 'banner_url'] as $field => $column) {
            if ($request->hasFile($field)) {
                $attributes[$column] = PublicUpload::url($request->file($field), 'posts');
            } elseif ($request->boolean("remove_{$field}")) {
                $attributes[$column] = null;
            }

            if ($post && array_key_exists($column, $attributes)) {
                $this->deleteUpload($post->{$column});
            }
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
        $base = Str::slug($title) ?: 'post';
        $slug = $base;

        for ($i = 2; Post::where('slug', $slug)->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }
}
