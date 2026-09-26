<?php

namespace App\Http\Controllers\Admin;

use App\Enums\LessonType;
use App\Http\Controllers\Admin\Concerns\ManagesQuestions;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\ExamQuestion;
use App\Models\Lesson;
use App\Support\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A course quiz's questions, edited with the same question editor as exams.
 */
class QuizQuestionController extends Controller
{
    use ManagesQuestions;

    public function __construct(private HtmlSanitizer $sanitizer) {}

    public function index(Course $course, Lesson $lesson): Response
    {
        abort_unless($lesson->type === LessonType::Quiz, 404);

        return Inertia::render('admin/courses/quiz-questions', [
            'course' => $course->only(['id', 'title']),
            'quiz' => $lesson->only(['id', 'title', 'total_mark', 'pass_mark']),
            'questions' => $lesson->questions()->get(),
        ]);
    }

    public function store(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        abort_unless($lesson->type === LessonType::Quiz, 404);

        $lesson->questions()->create([
            ...$this->validated($request),
            'position' => (int) $lesson->questions()->max('position') + 1,
        ]);

        return $this->done(__('Question added.'));
    }

    public function update(Request $request, Course $course, Lesson $lesson, ExamQuestion $question): RedirectResponse
    {
        abort_unless($question->lesson_id === $lesson->id, 404);

        $question->update($this->validated($request));

        return $this->done(__('Question updated.'));
    }

    public function destroy(Course $course, Lesson $lesson, ExamQuestion $question): RedirectResponse
    {
        abort_unless($question->lesson_id === $lesson->id, 404);

        $question->delete();

        return $this->done(__('Question deleted.'));
    }

    public function sort(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $this->reorder($request, $lesson->questions());

        return $this->done(__('Questions reordered.'));
    }

    private function done(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
