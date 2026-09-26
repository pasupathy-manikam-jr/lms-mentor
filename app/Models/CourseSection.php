<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A section of a course's curriculum, holding ordered lessons.
 *
 * @property int $id
 * @property int $course_id
 * @property string $title
 * @property int $position
 */
#[Fillable(['course_id', 'title', 'position'])]
class CourseSection extends Model
{
    /**
     * Delete lessons one by one (not only by foreign-key cascade) so their uploaded files are removed.
     */
    protected static function booted(): void
    {
        static::deleting(fn (self $model) => $model->lessons()->get()->each->delete());
    }

    /**
     * @return BelongsTo<Course, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * @return HasMany<Lesson, $this>
     */
    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('position');
    }
}
