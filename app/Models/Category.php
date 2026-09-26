<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A subject shared by courses, exams, store products and blog posts. Top-level categories may have
 * subcategories; the protected Default category receives the content of deleted categories.
 *
 * @property int $id
 * @property int|null $parent_id
 * @property string $name
 * @property string $slug
 * @property string $icon
 * @property int $position
 * @property bool $is_default
 */
#[Fillable(['parent_id', 'name', 'slug', 'icon', 'position'])]
class Category extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    /**
     * Top-level categories for a public catalog sidebar, in admin order, with the number of items of one kind.
     * The Default category is left out while it holds none of them.
     *
     * @param  'courses'|'exams'|'products'|'posts'  $relation
     * @param  'approved'|'published'  $scope  The items' own scope for what the public may see.
     * @return Collection<int, Category>
     */
    public static function listedFor(string $relation, string $scope, string $countAs = 'items_count'): Collection
    {
        return self::query()
            ->whereNull('parent_id')
            ->withCount(["{$relation} as {$countAs}" => fn ($query) => $query->{$scope}()])
            ->orderBy('position')
            ->orderBy('id')
            ->get()
            ->reject(fn (Category $category) => $category->is_default && $category->{$countAs} === 0)
            ->values();
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    /**
     * @return HasMany<Category, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id')->orderBy('position')->orderBy('id');
    }

    /**
     * @return HasMany<Course, $this>
     */
    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }

    /**
     * @return HasMany<Exam, $this>
     */
    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class);
    }

    /**
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * @return HasMany<Post, $this>
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}
