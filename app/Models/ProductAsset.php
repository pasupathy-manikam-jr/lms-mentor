<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * A product's gallery image (kind "image", public disk) or downloadable file (kind "file", private disk,
 * delivered to buyers).
 *
 * @property int $id
 * @property int $product_id
 * @property string $kind image|file
 * @property string $name Original file name.
 * @property string $path
 * @property int $size Bytes.
 */
#[Fillable(['product_id', 'kind', 'name', 'path', 'size'])]
class ProductAsset extends Model
{
    /**
     * Remove the stored file along with the record.
     */
    protected static function booted(): void
    {
        static::deleted(fn (ProductAsset $asset) => Storage::disk($asset->disk())->delete($asset->path));
    }

    public function disk(): string
    {
        return $this->kind === 'image' ? 'public' : 'local';
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
