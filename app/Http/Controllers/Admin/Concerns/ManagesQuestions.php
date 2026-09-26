<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Enums\QuestionType;
use App\Models\ExamQuestion;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Validating, saving and ordering questions, shared by the exam editor and course quizzes.
 * Requires a HtmlSanitizer in $this->sanitizer.
 */
trait ManagesQuestions
{
    /**
     * Save a new order. The list must name exactly the owner's questions.
     *
     * @param  HasMany<ExamQuestion, *>  $questions
     */
    protected function reorder(Request $request, HasMany $questions): void
    {
        $ids = $questions->pluck('id')->all();
        $validated = $request->validate([
            'ids' => ['required', 'array', 'size:'.count($ids)],
            'ids.*' => ['integer', 'distinct', Rule::in($ids)],
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['ids'] as $position => $id) {
                ExamQuestion::whereKey($id)->update(['position' => $position + 1]);
            }
        });
    }

    /**
     * @return array<string, mixed>
     */
    protected function validated(Request $request): array
    {
        $type = QuestionType::tryFrom((string) $request->input('type'));

        $validated = $request->validate([
            'type' => ['required', Rule::enum(QuestionType::class)],
            'title' => ['required', 'string', 'max:2000'],
            'description' => ['nullable', 'string', 'max:20000'],
            'marks' => ['required', 'numeric', 'gt:0', 'max:1000'],
            ...($type?->rules() ?? []),
        ], [], ['answer' => __('correct answer')]);

        if ($type?->hasOptions()) {
            // Every correct answer must point at an existing option.
            validator($validated, [])->after(function (Validator $validator) use ($validated) {
                foreach ($validated['answer'] as $index) {
                    if (! array_key_exists($index, $validated['options'])) {
                        $validator->errors()->add('answer', __('Mark a correct option.'));
                    }
                }
            })->validate();
        }

        return [
            'type' => $type,
            'title' => $validated['title'],
            'description' => $this->sanitizer->clean($validated['description'] ?? null),
            'options' => $type->hasOptions() ? array_values($validated['options']) : null,
            'answer' => array_values($validated['answer']),
            'marks' => $validated['marks'],
        ];
    }
}
