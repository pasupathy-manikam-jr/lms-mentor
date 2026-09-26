<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * A payment for a course, exam or store product: online through a gateway, or offline (bank transfer)
 * with a proof that an admin approves or rejects in Billings → Offline Payments.
 *
 * @property int $id
 * @property int $user_id
 * @property string $payable_type
 * @property int $payable_id
 * @property int|null $coupon_id
 * @property string $discount Coupon discount in the site currency.
 * @property string $amount
 * @property string $currency
 * @property string $method stripe|paypal|toyyibpay|offline
 * @property string|null $transaction_id
 * @property string $status pending|paid|rejected
 * @property CarbonImmutable|null $paid_on
 * @property string|null $proof_path
 * @property string|null $note
 */
#[Fillable(['user_id', 'payable_type', 'payable_id', 'coupon_id', 'discount', 'amount', 'currency', 'method', 'transaction_id', 'status', 'paid_on', 'proof_path', 'note'])]
#[Hidden(['proof_path'])]
class Payment extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'discount' => 'decimal:2',
            'paid_on' => 'date:Y-m-d',
        ];
    }

    protected static function booted(): void
    {
        static::deleted(function (Payment $payment) {
            if ($payment->proof_path) {
                Storage::disk('local')->delete($payment->proof_path);
            }
        });
    }

    /**
     * Mark the payment paid and give the customer what they bought. Safe to call twice.
     */
    public function fulfil(): void
    {
        DB::transaction(function () {
            $this->update(['status' => 'paid']);
            // Enrolments record the site-currency price after any coupon, whatever currency the gateway charged in.
            $item = $this->item();
            $price = (float) $item->price;
            static::grant($this->user, $item, $price - (float) $this->discount, (float) $this->discount);
        });
    }

    /**
     * Give a user a course or exam enrolment, or a store order (which uses up one unit of limited
     * stock). An existing enrolment is kept.
     */
    public static function grant(User $user, Course|Exam|Product $item, float $amountPaid, float $discount = 0): void
    {
        match (true) {
            $item instanceof Course => Enrollment::firstOrCreate(
                ['user_id' => $user->id, 'course_id' => $item->id],
                ['price_paid' => $amountPaid, 'expires_at' => $item->accessEndsAt()],
            ),
            $item instanceof Exam => ExamEnrollment::firstOrCreate(
                ['user_id' => $user->id, 'exam_id' => $item->id],
                ['price_paid' => $amountPaid, 'expires_at' => $item->accessEndsAt()],
            ),
            $item instanceof Product => ProductOrder::firstOrCreate(
                ['user_id' => $user->id, 'product_id' => $item->id],
                ['subtotal' => $amountPaid + $discount, 'discount' => $discount, 'tax' => 0, 'total' => $amountPaid],
            )->wasRecentlyCreated && $item->stock !== null && $item->decrement('stock'),
        };
    }

    /**
     * Whether a user already has an item ("owned"), is waiting for an offline payment to be approved
     * ("pending"), or neither (null).
     */
    public static function ownership(User $user, Course|Exam|Product $item): ?string
    {
        $owned = match (true) {
            $item instanceof Course => $user->enrollments()->whereBelongsTo($item)->active()->exists(),
            $item instanceof Exam => $user->examEnrollments()->whereBelongsTo($item)->exists(),
            $item instanceof Product => $user->productOrders()->whereBelongsTo($item)->exists(),
        };

        if ($owned) {
            return 'owned';
        }

        return static::whereBelongsTo($user)->whereMorphedTo('payable', $item)
            ->where('method', 'offline')->where('status', 'pending')->exists() ? 'pending' : null;
    }

    /**
     * The course, exam or product paid for. The payable has no foreign key, so it can be deleted while
     * its payments remain: that is a 404, not a type error.
     */
    public function item(): Course|Exam|Product
    {
        $item = $this->payable;

        if ($item instanceof Course || $item instanceof Exam || $item instanceof Product) {
            return $item;
        }

        throw new ModelNotFoundException("The {$this->payable_type} this payment is for no longer exists.");
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The course, exam or product paid for. Null once that item is deleted; see item().
     *
     * @return MorphTo<Model, $this>
     */
    public function payable(): MorphTo
    {
        return $this->morphTo();
    }
}
