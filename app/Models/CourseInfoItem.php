<?php

namespace App\Models;

use App\Enums\CourseInfoType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One FAQ, requirement or outcome of a course. For FAQs the title is the question and the body the
 * answer; requirements and outcomes only use the title.
 *
 * @property int $id
 * @property int $course_id
 * @property CourseInfoType $type
 * @property string $title
 * @property string|null $body
 * @property int $position
 */
#[Fillable(['course_id', 'type', 'title', 'body', 'position'])]
class CourseInfoItem extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => CourseInfoType::class,
        ];
    }

    /**
     * @return BelongsTo<Course, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
