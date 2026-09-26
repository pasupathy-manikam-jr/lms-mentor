<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

/**
 * A teacher shown on the site and assigned to courses, exams and products. Admins create instructors
 * directly (approved), or users apply to become one (pending until an admin approves or rejects).
 * The resume is kept on the private local disk.
 *
 * @property int $id
 * @property int|null $user_id
 * @property string $status pending|approved|rejected
 * @property string $name
 * @property string $title Designation, e.g. "Ayurveda Physician".
 * @property string|null $avatar_url
 * @property list<string>|null $skills
 * @property string|null $biography
 * @property string|null $resume_path
 * @property string|null $resume_name
 * @property string|null $payout_details How the instructor wants to be paid (bank details etc.).
 */
#[Fillable(['user_id', 'status', 'name', 'title', 'avatar_url', 'skills', 'biography', 'resume_path', 'resume_name', 'payout_details'])]
#[Hidden(['resume_path'])]
class Instructor extends Model
{
    public const STATUSES = ['pending', 'approved', 'rejected'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'skills' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::deleted(function (Instructor $instructor) {
            if ($instructor->resume_path) {
                Storage::disk('local')->delete($instructor->resume_path);
            }
        });
    }

    /**
     * Only instructors an admin has approved; the site and the instructor pickers use these.
     *
     * @param  Builder<Instructor>  $query
     */
    public function scopeApproved(Builder $query): void
    {
        $query->where('status', 'approved');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Course, $this>
     */
    public function courses(): HasMany
    {
        return $this->hasMany(Course::class);
    }
}
