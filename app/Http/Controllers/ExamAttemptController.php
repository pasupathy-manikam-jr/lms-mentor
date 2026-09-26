<?php

namespace App\Http\Controllers;

use App\Enums\LessonType;
use App\Models\CertificateTemplate;
use App\Models\Course;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\Lesson;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Taking an exam: start an attempt (enrolled students, within the exam's attempt limit), answer the
 * questions against the timer, submit, and see the result. Passing gives an exam certificate.
 */
class ExamAttemptController extends Controller
{
    public function store(Request $request, Exam $exam): RedirectResponse
    {
        $user = $request->user();

        abort_unless($user->examEnrollments()->whereBelongsTo($exam)
            ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->exists(), 403);
        abort_unless($exam->questions()->exists(), 404);

        // Carry on with an unfinished attempt rather than starting another.
        $open = $user->examAttempts()->whereBelongsTo($exam)->whereNull('submitted_at')->latest('id')->first();

        if ($open?->isOpen()) {
            return to_route('exams.attempts.show', $open);
        }

        if ($open) {
            $open->submit($open->answers ?? []);
        }

        if ($exam->max_attempts > 0 && $user->examAttempts()->whereBelongsTo($exam)->count() >= $exam->max_attempts) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('You have used all your attempts at this exam.')]);

            return back();
        }

        $attempt = $user->examAttempts()->create([
            'exam_id' => $exam->id,
            'started_at' => now(),
            'ends_at' => now()->addMinutes(max(1, $exam->duration_minutes)),
        ]);

        return to_route('exams.attempts.show', $attempt);
    }

    public function show(Request $request, ExamAttempt $attempt): Response
    {
        abort_unless($attempt->user_id === $request->user()->id, 404);

        $source = $attempt->source();
        $context = $source instanceof Exam ? [
            'title' => $source->title,
            'pass_label' => __('pass mark :pass%', ['pass' => $source->pass_percentage]),
            'back_url' => route('exams.show', $source),
            'certificate_url' => route('exams.certificate', $source),
        ] : [
            'title' => $source->title,
            'pass_label' => __('pass mark :pass', ['pass' => $source->pass_mark ?? (string) __('all marks')]),
            'back_url' => route('courses.learn', ['course' => $source->course->slug, 'lesson' => $source->id]),
            'certificate_url' => null,
        ];

        if ($attempt->isOpen()) {
            return Inertia::render('exams/attempt', [
                'attempt' => $attempt->only(['id', 'answers']) + ['ends_at' => $attempt->ends_at->toIso8601String()],
                'exam' => $context,
                'questions' => $attempt->questionsForStudent(),
            ]);
        }

        // Time ran out without a submit: grade what was saved (nothing), so the result is final.
        if ($attempt->submitted_at === null) {
            $attempt->submit([]);
        }

        return Inertia::render('exams/result', [
            'attempt' => $attempt->only(['id', 'score', 'total_marks', 'needs_review', 'passed']) + [
                'submitted_at' => $attempt->submitted_at->toIso8601String(),
                'percentage' => (float) $attempt->total_marks > 0 ? round((float) $attempt->score / (float) $attempt->total_marks * 100, 1) : 0,
            ],
            'exam' => $context,
            'review' => $source->questions()->get()->map(fn ($question) => [
                'id' => $question->id,
                'title' => $question->title,
                'marks' => (float) $question->marks,
                'awarded' => $attempt->marks[$question->id] ?? null,
            ]),
        ]);
    }

    /**
     * Start (or continue) a course quiz from the player, within its retake limit.
     */
    public function startQuiz(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        Gate::authorize('play-course', $course);
        abort_unless($lesson->type === LessonType::Quiz && $lesson->questions()->exists(), 404);

        $user = $request->user();
        $attempts = $user->examAttempts()->where('lesson_id', $lesson->id);
        $open = (clone $attempts)->whereNull('submitted_at')->latest('id')->first();

        if ($open?->isOpen()) {
            return to_route('exams.attempts.show', $open);
        }

        if ($open) {
            $open->submit($open->answers ?? []);
        }

        if ($lesson->retake_attempts && (clone $attempts)->count() >= $lesson->retake_attempts) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('You have used all your attempts at this quiz.')]);

            return back();
        }

        $attempt = $user->examAttempts()->create([
            'lesson_id' => $lesson->id,
            'started_at' => now(),
            // Quizzes without a time limit stay open for a day.
            'ends_at' => now()->addSeconds($lesson->time_limit_seconds ?: 86400),
        ]);

        return to_route('exams.attempts.show', $attempt);
    }

    public function submit(Request $request, ExamAttempt $attempt): RedirectResponse
    {
        abort_unless($attempt->user_id === $request->user()->id, 404);

        if ($attempt->submitted_at === null) {
            $answers = $request->validate(['answers' => ['nullable', 'array']])['answers'] ?? [];
            // Answers sent after the timer (plus grace) are not counted.
            $attempt->submit($attempt->isOpen() ? $answers : []);
        }

        return to_route('exams.attempts.show', $attempt);
    }

    /**
     * The certificate for a passed exam, drawn with the active exam certificate template.
     */
    public function certificate(Request $request, Exam $exam): Response
    {
        $passed = $request->user()->examAttempts()->whereBelongsTo($exam)->where('passed', true)->latest('submitted_at')->first();
        abort_unless($passed !== null, 404);

        $template = CertificateTemplate::activeFor('certificate', 'exam');
        abort_unless($template !== null, 404);

        return Inertia::render('courses/certificate', [
            'template' => $template->only(['design', 'colors', 'content']),
            'data' => [
                'recipient' => $request->user()->name,
                'course' => $exam->title,
                'date' => $passed->submitted_at->settings(['locale' => app()->getLocale()])->isoFormat('LL'),
                'grade' => __(':percent%', ['percent' => round((float) $passed->score / max(1, (float) $passed->total_marks) * 100)]),
            ],
            'courseUrl' => route('exams.show', $exam),
        ]);
    }
}
