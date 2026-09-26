<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * An instructor's request to withdraw their earnings.
 *
 * @property int $id
 * @property int $instructor_id
 * @property string $amount
 * @property string $status pending, approved (paid) or rejected
 * @property string|null $payout_method How it was paid, e.g. "Bank transfer".
 * @property string|null $note
 * @property Carbon|null $processed_at
 */
#[Fillable(['instructor_id', 'amount', 'status', 'payout_method', 'note', 'processed_at'])]
class PayoutRequest extends Model
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
            'processed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Instructor, $this>
     */
    public function instructor(): BelongsTo
    {
        return $this->belongsTo(Instructor::class);
    }
}
