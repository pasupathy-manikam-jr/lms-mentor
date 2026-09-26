<?php

namespace App\Models;

use App\Enums\QuestionType;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Collection;
use Random\Engine\Mt19937;
use Random\Randomizer;

/**
 * One attempt at an exam or at a course quiz (lesson_id). Answers are graded on submit; short answers
 * wait for an admin's marks. Exams pass on a percentage, quizzes on their pass mark; passing a quiz
 * completes its lesson.
 *
 * @property int $id
 * @property int $user_id
 * @property int|null $exam_id
 * @property int|null $lesson_id
 * @property CarbonImmutable $started_at
 * @property CarbonImmutable $ends_at
 * @property CarbonImmutable|null $submitted_at
 * @property array<int, mixed>|null $answers Keyed by question id.
 * @property array<int, float|null>|null $marks Keyed by question id.
 * @property string|null $score
 * @property string $total_marks
 * @property bool $needs_review
 * @property bool|null $passed
 */
#[Fillable(['user_id', 'exam_id', 'lesson_id', 'started_at', 'ends_at', 'submitted_at', 'answers', 'marks', 'score', 'total_marks', 'needs_review', 'passed'])]
class ExamAttempt extends Model
{
    /** Late submissions are accepted this many seconds after the timer ends (slow networks). */
    public const GRACE_SECONDS = 60;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ends_at' => 'datetime',
            'submitted_at' => 'datetime',
            'answers' => 'array',
            'marks' => 'array',
            'score' => 'decimal:2',
            'total_marks' => 'decimal:2',
            'needs_review' => 'boolean',
            'passed' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Exam, $this>
     */
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    /**
     * @return BelongsTo<Lesson, $this>
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /**
     * The exam or quiz lesson this attempt is for.
     */
    public function source(): Exam|Lesson
    {
        return $this->exam ?? $this->lesson;
    }

    public function isOpen(): bool
    {
        return $this->submitted_at === null && now()->lte($this->ends_at->addSeconds(self::GRACE_SECONDS));
    }

    /**
     * Save the answers and grade them. Short answers get null marks and put the attempt up for review.
     *
     * @param  array<int, mixed>  $answers  Keyed by question id.
     */
    public function submit(array $answers): void
    {
        $questions = $this->source()->questions()->get();
        $marks = $questions->mapWithKeys(fn (ExamQuestion $question) => [
            $question->id => static::grade($question, $answers[$question->id] ?? null),
        ])->all();

        $this->fill([
            'answers' => collect($answers)->only($questions->pluck('id')->all())->all(),
            'marks' => $marks,
            'submitted_at' => now(),
            'total_marks' => $questions->sum(fn (ExamQuestion $question) => (float) $question->marks),
        ]);

        $this->finish();
    }

    /**
     * Work out the score and the result from the marks, unless some still need review.
     */
    public function finish(): void
    {
        $marks = collect($this->marks ?? []);
        $this->needs_review = $marks->containsStrict(null);
        $this->score = $marks->sum();
        $this->passed = $this->needs_review ? null : $this->meetsPassMark();
        $this->save();

        if ($this->passed && $this->lesson_id) {
            $this->user->completedLessons()->syncWithoutDetaching([$this->lesson_id]);
        }
    }

    /**
     * Exams need their pass percentage; quizzes need their pass mark (or all marks when none is set).
     */
    private function meetsPassMark(): bool
    {
        if ((float) $this->total_marks <= 0) {
            return false;
        }

        if ($this->exam_id) {
            return (float) $this->score / (float) $this->total_marks * 100 >= $this->exam->pass_percentage;
        }

        return (float) $this->score >= (float) ($this->lesson->pass_mark ?? $this->total_marks);
    }

    /**
     * Marks for one answer: all or nothing, except short answers (null = an admin marks it).
     */
    public static function grade(ExamQuestion $question, mixed $answer): ?float
    {
        $full = (float) $question->marks;
        $expected = $question->answer;
        $normalise = fn (mixed $value) => mb_strtolower(trim((string) $value));

        $correct = match ($question->type) {
            QuestionType::MultipleChoice => is_numeric($answer) && (int) $answer === (int) ($expected[0] ?? -1),
            QuestionType::MultipleSelect => is_array($answer)
                && collect($answer)->map(fn ($value) => (int) $value)->sort()->values()->all() === collect($expected)->map(fn ($value) => (int) $value)->sort()->values()->all(),
            QuestionType::FillBlank => is_string($answer) && collect($expected)->map($normalise)->contains($normalise($answer)),
            QuestionType::Ordering => is_array($answer) && array_map($normalise, array_values($answer)) === array_map($normalise, $expected),
            QuestionType::Matching => is_array($answer) && collect($expected)->every(fn (array $pair, int $i) => $normalise($answer[$i] ?? '') === $normalise($pair['right'])),
            QuestionType::ShortAnswer => null,
        };

        return $correct === null ? (blank($answer) ? 0.0 : null) : ($correct ? $full : 0.0);
    }

    /**
     * The exam's questions as the student sees them: no answers, and ordering and matching items
     * shuffled the same way every time for this attempt.
     *
     * @return array<int, array<string, mixed>>
     */
    public function questionsForStudent(): array
    {
        return $this->source()->questions()->get()->map(fn (ExamQuestion $question): array => [
            'id' => $question->id,
            'type' => $question->type->value,
            'title' => $question->title,
            'description' => $question->description,
            'marks' => (float) $question->marks,
            'options' => $question->type->hasOptions() ? $question->options : null,
            'items' => $question->type === QuestionType::Ordering
                ? self::seededShuffle(collect($question->answer)->all(), $this->id * 7919 + $question->id)
                : null,
            'left' => $question->type === QuestionType::Matching ? collect($question->answer)->pluck('left')->all() : null,
            'right' => $question->type === QuestionType::Matching
                ? self::seededShuffle(collect($question->answer)->pluck('right')->all(), $this->id * 104729 + $question->id)
                : null,
        ])->all();
    }

    /**
     * The same order for the same seed, so a reload shows the items as before. Collection::shuffle()
     * takes no seed.
     *
     * @param  array<int, mixed>  $items
     * @return list<mixed>
     */
    private static function seededShuffle(array $items, int $seed): array
    {
        return (new Randomizer(new Mt19937($seed)))->shuffleArray(array_values($items));
    }
}
