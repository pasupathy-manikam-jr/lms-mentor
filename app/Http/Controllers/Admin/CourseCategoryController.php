<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
use App\Models\Exam;
use App\Models\Post;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CourseCategoryController extends Controller
{
    /**
     * All categories as cards: the protected Default first, then top-level categories with their subcategories.
     */
    public function index(): Response
    {
        return Inertia::render('admin/course-categories/index', [
            'categories' => Category::whereNull('parent_id')
                ->with('children:id,parent_id,name,slug,icon,position')
                ->orderByDesc('is_default')
                ->orderBy('position')
                ->orderBy('id')
                ->get(['id', 'name', 'slug', 'icon', 'position', 'is_default']),
        ]);
    }

    /**
     * Add a category, or a subcategory when parent_id is given.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);
        $siblings = Category::where('parent_id', $validated['parent_id'] ?? null);

        Category::create([
            ...$validated,
            'slug' => $this->uniqueSlug($validated['name']),
            'position' => (int) $siblings->max('position') + 1,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category added.')]);

        return back();
    }

    /**
     * Rename a category or change its icon. The Default category is protected.
     */
    public function update(Request $request, Category $category): RedirectResponse
    {
        abort_if($category->is_default, 403);

        $validated = $this->validated($request, $category);

        $category->update([
            'name' => $validated['name'],
            'icon' => $validated['icon'],
            'slug' => $category->name === $validated['name'] ? $category->slug : $this->uniqueSlug($validated['name'], $category),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category updated.')]);

        return back();
    }

    /**
     * Delete a category and its subcategories. Their courses, exams, products and posts move to the Default category.
     */
    public function destroy(Category $category): RedirectResponse
    {
        abort_if($category->is_default, 403);

        $default = Category::where('is_default', true)->firstOrFail();
        $ids = $category->children()->pluck('id')->push($category->id);

        DB::transaction(function () use ($category, $default, $ids) {
            foreach ([Course::class, Exam::class, Product::class, Post::class] as $model) {
                $model::whereIn('category_id', $ids)->update(['category_id' => $default->id]);
            }

            $category->delete();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category deleted. Its content moved to :default.', ['default' => $default->name])]);

        return back();
    }

    /**
     * Save a new order for top-level categories.
     */
    public function sort(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', Rule::exists('categories', 'id')->where(fn ($query) => $query->whereNull('parent_id')->where('is_default', false))],
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['ids'] as $index => $id) {
                Category::whereKey($id)->update(['position' => $index + 1]);
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category order saved.')]);

        return back();
    }

    /**
     * @return array{name: string, icon: string, parent_id?: int|null}
     */
    private function validated(Request $request, ?Category $category = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'icon' => ['required', 'string', 'max:40', 'regex:/^[a-z0-9-]+$/'],
            // Only one level of nesting, and never under the Default category. Not changeable on edit.
            'parent_id' => $category ? ['prohibited'] : [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')->where(fn ($query) => $query->whereNull('parent_id')->where('is_default', false)),
            ],
        ]);
    }

    private function uniqueSlug(string $name, ?Category $ignore = null): string
    {
        $base = Str::slug($name) ?: 'category';
        $slug = $base;

        for ($i = 2; Category::where('slug', $slug)->when($ignore, fn ($query) => $query->whereKeyNot($ignore->id))->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }
}
