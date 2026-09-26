<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A discount code for a course, an exam or a store product (applies_to). With no course/exam it applies to every item of
 * that kind ("global coupon").
 *
 * @property int $id
 * @property string $code
 * @property string $discount_type percentage|fixed
 * @property string $discount
 * @property string $applies_to course|exam|product
 * @property int|null $course_id
 * @property int|null $exam_id
 * @property int|null $product_id
 * @property Carbon $valid_from
 * @property Carbon $valid_to
 * @property bool $is_active
 */
#[Fillable(['code', 'discount_type', 'discount', 'applies_to', 'course_id', 'exam_id', 'product_id', 'valid_from', 'valid_to', 'is_active'])]
class Coupon extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'discount' => 'decimal:2',
            'valid_from' => 'datetime',
            'valid_to' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /**
     * active, inactive (switched off), scheduled (not started yet) or expired.
     */
    public function status(): string
    {
        return match (true) {
            ! $this->is_active => 'inactive',
            now()->lt($this->valid_from) => 'scheduled',
            now()->gt($this->valid_to) => 'expired',
            default => 'active',
        };
    }

    /**
     * The coupon a customer typed for an item, if it is usable now: active, in its dates, for this
     * kind of item, and either global or for this exact item. Codes are stored upper case.
     */
    public static function findFor(?string $code, Course|Exam|Product $item): ?self
    {
        if (blank($code)) {
            return null;
        }

        $type = $item->getMorphClass();
        $coupon = static::where('code', strtoupper(trim($code)))->where('applies_to', $type)->first();

        return $coupon && $coupon->status() === 'active' && in_array($coupon->{"{$type}_id"}, [null, $item->id], true)
            ? $coupon
            : null;
    }

    /**
     * The price after this coupon, never below zero.
     */
    public function apply(float $price): float
    {
        $discounted = $this->discount_type === 'percentage'
            ? $price * (1 - (float) $this->discount / 100)
            : $price - (float) $this->discount;

        return max(0, round($discounted, 2));
    }

    /**
     * @return BelongsTo<Course, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * @return BelongsTo<Exam, $this>
     */
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
