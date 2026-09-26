<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A product specification (title = label, body = value) or FAQ (title = question, body = answer).
 *
 * @property int $id
 * @property int $product_id
 * @property string $type specification|faq
 * @property string $title
 * @property string $body
 * @property int $position
 */
#[Fillable(['product_id', 'type', 'title', 'body', 'position'])]
class ProductInfoItem extends Model
{
    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
