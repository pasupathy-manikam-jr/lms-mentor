<?php

namespace App\Http\Controllers\Admin;

use App\Enums\QuestionType;
use App\Http\Controllers\Controller;
use App\Models\ExamAttempt;
use App\Models\ExamQuestion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Exams → Results: every submitted attempt, and marking the short answers that grading can't check.
 */
class ExamAttemptController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'review' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'in:10,20,50'],
        ]);

        $attempts = ExamAttempt::query()
            ->whereNotNull('submitted_at')
            ->with(['user:id,name,email', 'exam:id,title,pass_percentage'])
            ->when($request->boolean('review'), fn ($query) => $query->where('needs_review', true))
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query
                ->whereHas('user', fn ($query) => $query->whereLike('name', "%{$search}%")->orWhereLike('email', "%{$search}%"))
                ->orWhereHas('exam', fn ($query) => $query->whereLike('title', "%{$search}%"))))
            ->latest('submitted_at')
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString()
            ->through(fn (ExamAttempt $attempt) => [
                ...$attempt->only(['id', 'score', 'total_marks', 'needs_review', 'passed']),
                'submitted_at' => $attempt->submitted_at->toIso8601String(),
                'user' => $attempt->user->only(['name', 'email']),
                'exam' => $attempt->exam->only(['title']),
            ]);

        return Inertia::render('admin/exam-attempts/index', [
            'attempts' => $attempts,
            'filters' => $filters,
            'reviewCount' => ExamAttempt::where('needs_review', true)->count(),
        ]);
    }

    /**
     * The written answers of one attempt, with each question's model answer as a marking guide.
     */
    public function show(ExamAttempt $attempt): Response
    {
        $questions = $attempt->exam->questions()->where('type', QuestionType::ShortAnswer)->get();

        return Inertia::render('admin/exam-attempts/mark', [
            'attempt' => $attempt->only(['id']) + ['user' => $attempt->user->only(['name']), 'exam' => $attempt->exam->only(['title'])],
            'answers' => $questions->map(fn (ExamQuestion $question) => [
                'question_id' => $question->id,
                'title' => $question->title,
                'guide' => $question->answer[0] ?? null,
                'max' => (float) $question->marks,
                'answer' => $attempt->answers[$question->id] ?? '',
                'awarded' => $attempt->marks[$question->id] ?? null,
            ]),
        ]);
    }

    public function update(Request $request, ExamAttempt $attempt): RedirectResponse
    {
        $questions = $attempt->exam->questions()->where('type', QuestionType::ShortAnswer)->get()->keyBy('id');
        $marks = $request->validate(['marks' => ['required', 'array'], 'marks.*' => ['required', 'numeric', 'min:0']])['marks'];

        foreach ($marks as $questionId => $value) {
            $question = $questions->get($questionId) ?? throw ValidationException::withMessages(['marks' => __('Unknown question.')]);

            if ((float) $value > (float) $question->marks) {
                throw ValidationException::withMessages(["marks.{$questionId}" => __('At most :max marks.', ['max' => (float) $question->marks])]);
            }
        }

        $attempt->marks = array_replace($attempt->marks ?? [], array_map(floatval(...), $marks));
        $attempt->finish();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Marks saved.')]);

        return to_route('admin.exam-attempts.index', ['review' => 1]);
    }
}
