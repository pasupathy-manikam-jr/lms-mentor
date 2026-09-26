<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Support\HtmlSanitizer;
use App\Support\PublicUpload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Frontend → Pages, following the Mentor demo's page list. Built-in pages keep their design and get a
 * form for their section wording and SEO; custom pages are a title and a rich-text body.
 */
class PageController extends Controller
{
    /**
     * Where each built-in page lives on the site.
     *
     * @var array<string, string>
     */
    private const BUILT_IN_ROUTES = ['home' => 'home', 'about' => 'about', 'team' => 'team.index', 'careers' => 'careers.index'];

    public function index(): Response
    {
        $pages = Page::orderByRaw("kind = 'custom'")->orderBy('id')->get(['id', 'slug', 'title', 'kind', 'is_published']);

        return Inertia::render('admin/pages/index', [
            'pages' => $pages->map(fn (Page $page) => [...$page->toArray(), 'url' => $this->publicUrl($page)]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/pages/edit', ['page' => null]);
    }

    public function store(Request $request, HtmlSanitizer $sanitizer): RedirectResponse
    {
        $validated = $this->validated($request);

        $page = Page::create([
            ...$this->customAttributes($request, $validated, $sanitizer),
            ...$this->seoAttributes($request, $validated),
            'kind' => 'custom',
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Page created.')]);

        return to_route('admin.pages.edit', $page);
    }

    public function edit(Page $page): Response
    {
        return Inertia::render('admin/pages/edit', [
            'page' => [
                ...$page->only(['id', 'slug', 'title', 'kind', 'body', 'is_published', 'meta_title', 'meta_description', 'og_image_url']),
                'content' => (object) ($page->content ?? []),
                'url' => $this->publicUrl($page),
            ],
        ]);
    }

    public function update(Request $request, Page $page, HtmlSanitizer $sanitizer): RedirectResponse
    {
        $validated = $this->validated($request, $page);

        $page->update([
            ...($page->isBuiltIn()
                ? ['content' => $this->contentFrom($validated['content'] ?? [])]
                : $this->customAttributes($request, $validated, $sanitizer)),
            ...$this->seoAttributes($request, $validated, $page),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Page updated.')]);

        return back();
    }

    /**
     * Built-in pages are part of the site and cannot be deleted.
     */
    public function destroy(Page $page): RedirectResponse
    {
        abort_if($page->isBuiltIn(), 403);

        $this->deleteUpload($page->og_image_url);
        $page->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Page deleted.')]);

        return to_route('admin.pages.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Page $page = null): array
    {
        $isCustom = ! $page?->isBuiltIn();

        return $request->validate([
            'title' => [Rule::requiredIf($isCustom), 'nullable', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash:ascii', Rule::unique('pages', 'slug')->ignore($page)],
            'body' => [Rule::requiredIf($isCustom), 'nullable', 'string', 'max:200000'],
            'is_published' => ['boolean'],
            'content' => ['nullable', 'array', 'max:100'],
            'content.*' => ['nullable', 'string', 'max:5000'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:1000'],
            'og_image' => ['nullable', 'image', 'max:2048'],
            'remove_og_image' => ['boolean'],
        ]);
    }

    /**
     * Only filled-in wording is kept; an empty field brings back the built-in (translated) text.
     *
     * @param  array<array-key, mixed>  $content
     * @return array<string, string>
     */
    private function contentFrom(array $content): array
    {
        return collect($content)
            ->filter(fn ($value, $key) => is_string($key) && preg_match('/^[a-z0-9_]+$/', $key) && filled($value))
            ->map(fn (string $value) => trim($value))
            ->all();
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function customAttributes(Request $request, array $validated, HtmlSanitizer $sanitizer): array
    {
        return [
            'title' => $validated['title'],
            'slug' => ($validated['slug'] ?? null) ?: $this->uniqueSlug($validated['title']),
            'body' => $sanitizer->clean($validated['body']),
            'is_published' => $request->boolean('is_published'),
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function seoAttributes(Request $request, array $validated, ?Page $page = null): array
    {
        $attributes = [
            'meta_title' => $validated['meta_title'] ?? null,
            'meta_description' => $validated['meta_description'] ?? null,
        ];

        if ($request->hasFile('og_image')) {
            $attributes['og_image_url'] = PublicUpload::url($request->file('og_image'), 'pages');
        } elseif ($request->boolean('remove_og_image')) {
            $attributes['og_image_url'] = null;
        }

        if ($page && array_key_exists('og_image_url', $attributes)) {
            $this->deleteUpload($page->og_image_url);
        }

        return $attributes;
    }

    private function publicUrl(Page $page): string
    {
        return $page->isBuiltIn() ? route(self::BUILT_IN_ROUTES[$page->kind]) : route('pages.show', $page->slug);
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
        $base = Str::slug($title) ?: 'page';
        $slug = $base;

        for ($i = 2; Page::where('slug', $slug)->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }
}
