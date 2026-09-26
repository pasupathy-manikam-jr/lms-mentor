<?php

namespace App\Enums;

/**
 * Exam question types, as in the Mentor demo. Shapes of `options` and `answer`:
 * - multiple_choice: options = list of strings, answer = [index of the correct option]
 * - multiple_select: options = list of strings, answer = indexes of every correct option
 * - fill_blank: options = null, answer = accepted answers (case-insensitive)
 * - ordering: options = null, answer = items in the correct order
 * - matching: options = null, answer = list of {left, right} pairs
 * - short_answer: options = null, answer = [model answer used as a marking guide]
 */
enum QuestionType: string
{
    case MultipleChoice = 'multiple_choice';
    case MultipleSelect = 'multiple_select';
    case Matching = 'matching';
    case FillBlank = 'fill_blank';
    case Ordering = 'ordering';
    case ShortAnswer = 'short_answer';

    /**
     * Validation rules for the type-specific fields of a question.
     *
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return match ($this) {
            self::MultipleChoice, self::MultipleSelect => [
                'options' => ['required', 'array', 'min:2', 'max:10'],
                'options.*' => ['required', 'string', 'max:500'],
                'answer' => ['required', 'array', $this === self::MultipleChoice ? 'size:1' : 'min:1'],
                'answer.*' => ['integer', 'min:0', 'distinct'],
            ],
            self::Matching => [
                'answer' => ['required', 'array', 'min:2', 'max:10'],
                'answer.*.left' => ['required', 'string', 'max:255'],
                'answer.*.right' => ['required', 'string', 'max:255'],
            ],
            self::FillBlank, self::Ordering, self::ShortAnswer => [
                'answer' => ['required', 'array', $this === self::Ordering ? 'min:2' : 'min:1', 'max:10'],
                'answer.*' => ['required', 'string', 'max:2000'],
            ],
        };
    }

    public function hasOptions(): bool
    {
        return $this === self::MultipleChoice || $this === self::MultipleSelect;
    }
}
