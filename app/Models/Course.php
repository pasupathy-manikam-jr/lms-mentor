<?php

namespace App\Models;

use App\Enums\CourseStatus;
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
 * @property int|null $subcategory_id
 * @property int|null $instructor_id
 * @property string $title
 * @property string $slug
 * @property string $level
 * @property CourseStatus $status
 * @property string|null $short_description
 * @property string|null $description
 * @property string $language
 * @property string $expiry_type
 * @property int|null $expiry_months
 * @property bool $drip_content
 * @property string|null $image_url
 * @property string|null $banner_url
 * @property string|null $meta_title
 * @property string|null $meta_keywords
 * @property string|null $meta_description
 * @property string|null $og_title
 * @property string|null $og_description
 * @property string|null $preview_type video_url|video
 * @property string|null $preview_source The YouTube/Vimeo link, or the public URL of an uploaded video.
 * @property string $price
 * @property string|null $compare_at_price
 * @property int $duration_minutes
 * @property int $students_count
 * @property string $rating
 * @property int $reviews_count
 * @property bool $is_popular
 */
#[Fillable([
    'category_id', 'subcategory_id', 'instructor_id', 'title', 'level', 'language', 'status', 'short_description', 'description', 'expiry_type', 'expiry_months', 'drip_content', 'slug', 'image_url', 'banner_url', 'preview_type', 'preview_source', 'meta_title', 'meta_keywords', 'meta_description', 'og_title', 'og_description', 'price', 'compare_at_price', 'duration_minutes',
    'students_count', 'rating', 'reviews_count', 'is_popular',
])]
#[Hidden(['description'])] // The rich-text body is only needed on the course page, not in catalog lists.
class Course extends Model
{
    use HasAccessPeriod;

    /**
     * Delete lessons one by one (not only by foreign-key cascade) so their uploaded files are removed.
     */
    protected static function booted(): void
    {
        static::deleting(fn (self $model) => $model->lessons()->get()->each->delete());
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
            'is_popular' => 'boolean',
            'drip_content' => 'boolean',
            'status' => CourseStatus::class,
        ];
    }

    /**
     * Only courses that are live on the public site.
     *
     * @param  Builder<Course>  $query
     */
    public function scopeApproved(Builder $query): void
    {
        $query->where('status', CourseStatus::Approved);
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

    /**
     * @return HasMany<Lesson, $this>
     */
    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('position');
    }

    /**
     * @return HasMany<CourseSection, $this>
     */
    public function sections(): HasMany
    {
        return $this->hasMany(CourseSection::class)->orderBy('position');
    }

    /**
     * FAQs, requirements and outcomes, in list order.
     *
     * @return HasMany<CourseInfoItem, $this>
     */
    public function infoItems(): HasMany
    {
        return $this->hasMany(CourseInfoItem::class)->orderBy('position')->orderBy('id');
    }

    /**
     * @return HasMany<LiveClass, $this>
     */
    public function liveClasses(): HasMany
    {
        return $this->hasMany(LiveClass::class)->orderBy('starts_at');
    }

    /**
     * @return HasMany<Enrollment, $this>
     */
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'subcategory_id');
    }

    /**
     * @return HasMany<Assignment, $this>
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }
}
