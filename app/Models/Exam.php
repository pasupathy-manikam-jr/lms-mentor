<?php

namespace App\Models;

use App\Enums\ExamStatus;
use App\Models\Concerns\HasAccessPeriod;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $category_id
 * @property int|null $instructor_id
 * @property string $title
 * @property string $slug
 * @property string $level
 * @property ExamStatus $status
 * @property string|null $short_description
 * @property string|null $description Sanitized HTML.
 * @property int $total_marks
 * @property string $expiry_type
 * @property int|null $expiry_months
 * @property string|null $image_url
 * @property string $price
 * @property string|null $compare_at_price
 * @property int $duration_minutes
 * @property int $questions_count
 * @property int $pass_percentage
 * @property int $max_attempts
 * @property int $students_count
 * @property string $rating
 * @property int $reviews_count
 */
#[Fillable([
    'category_id', 'instructor_id', 'title', 'slug', 'level', 'status', 'short_description', 'description', 'image_url', 'price',
    'compare_at_price', 'expiry_type', 'expiry_months', 'duration_minutes', 'questions_count', 'pass_percentage', 'total_marks',
    'max_attempts', 'students_count', 'rating', 'reviews_count', 'meta_title', 'meta_keywords', 'meta_description', 'og_title',
    'og_description',
])]
#[Hidden(['description'])] // The rich-text body is only needed on the exam page, not in catalog lists.
class Exam extends Model
{
    use HasAccessPeriod;

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
            'status' => ExamStatus::class,
        ];
    }

    /**
     * Only exams that are live on the public site.
     *
     * @param  Builder<Exam>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->where('status', ExamStatus::Published);
    }

    /**
     * @return HasMany<ExamEnrollment, $this>
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(ExamEnrollment::class);
    }

    /**
     * @return HasMany<ExamQuestion, $this>
     */
    public function questions(): HasMany
    {
        return $this->hasMany(ExamQuestion::class)->orderBy('position')->orderBy('id');
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
