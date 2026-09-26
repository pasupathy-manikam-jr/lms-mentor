<?php

namespace App\Models;

use App\Enums\QuestionType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One question of an exam or of a course quiz (lesson_id); see App\Enums\QuestionType for the
 * options/answer shapes.
 *
 * @property int $id
 * @property int|null $exam_id
 * @property int|null $lesson_id
 * @property QuestionType $type
 * @property string $title
 * @property string|null $description Sanitized HTML.
 * @property list<string>|null $options
 * @property list<mixed> $answer
 * @property string $marks
 * @property int $position
 */
#[Fillable(['exam_id', 'lesson_id', 'type', 'title', 'description', 'options', 'answer', 'marks', 'position'])]
class ExamQuestion extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => QuestionType::class,
            'options' => 'array',
            'answer' => 'array',
            'marks' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Exam, $this>
     */
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }
}
