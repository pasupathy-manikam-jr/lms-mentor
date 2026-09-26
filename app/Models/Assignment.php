<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A task set for the students of a course.
 *
 * @property int $id
 * @property int $course_id
 * @property string $title
 */
#[Fillable(['course_id', 'title'])]
class Assignment extends Model
{
    /**
     * @return BelongsTo<Course, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
