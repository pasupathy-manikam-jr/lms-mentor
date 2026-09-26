<?php

namespace App\Models;

use App\Enums\ProductStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A digital store item such as an e-book, wall chart or study template.
 *
 * @property int $id
 * @property int $category_id
 * @property int|null $instructor_id
 * @property string $title
 * @property string $slug
 * @property string $type
 * @property ProductStatus $status
 * @property string|null $summary
 * @property string|null $description Sanitized HTML.
 * @property int|null $stock Null for unlimited inventory.
 * @property string|null $image_url
 * @property string $price
 * @property string|null $compare_at_price
 * @property string $format
 * @property int $sales_count
 * @property string $rating
 * @property int $reviews_count
 */
#[Fillable([
    'category_id', 'instructor_id', 'title', 'slug', 'type', 'status', 'summary', 'description', 'image_url', 'price',
    'compare_at_price', 'stock', 'format', 'sales_count', 'rating', 'reviews_count', 'meta_title', 'meta_keywords',
    'meta_description', 'og_title', 'og_description',
])]
#[Hidden(['description'])] // The rich-text body is only needed on the product page, not in catalog lists.
class Product extends Model
{
    /**
     * Delete gallery images and files one by one so their stored files are removed too.
     */
    protected static function booted(): void
    {
        static::deleting(fn (Product $product) => $product->assets()->get()->each->delete());
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'compare_at_price' => 'decimal:2',
            'rating' => 'decimal:1',
            'status' => ProductStatus::class,
        ];
    }

    /**
     * Only products that are live on the public site.
     *
     * @param  Builder<Product>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->where('status', ProductStatus::Published);
    }

    /**
     * @return HasMany<ProductAsset, $this>
     */
    public function assets(): HasMany
    {
        return $this->hasMany(ProductAsset::class)->orderBy('id');
    }

    /**
     * @return HasMany<ProductInfoItem, $this>
     */
    public function infoItems(): HasMany
    {
        return $this->hasMany(ProductInfoItem::class)->orderBy('position')->orderBy('id');
    }

    /**
     * @return HasMany<ProductOrder, $this>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(ProductOrder::class);
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @return BelongsTo<Instructor, $this>
     */
    public function instructor(): BelongsTo
    {
        return $this->belongsTo(Instructor::class);
    }
}
