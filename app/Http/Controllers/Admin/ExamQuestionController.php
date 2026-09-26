<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ManagesQuestions;
use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Support\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * The Questions tab of the exam editor. After every change the exam's question count is refreshed,
 * since the catalog shows it.
 */
class ExamQuestionController extends Controller
{
    use ManagesQuestions;

    public function __construct(private HtmlSanitizer $sanitizer) {}

    public function store(Request $request, Exam $exam): RedirectResponse
    {
        $exam->questions()->create([
            ...$this->validated($request),
            'position' => (int) $exam->questions()->max('position') + 1,
        ]);

        return $this->done($exam, __('Question added.'));
    }

    public function update(Request $request, Exam $exam, ExamQuestion $question): RedirectResponse
    {
        $question->update($this->validated($request));

        return $this->done($exam, __('Question updated.'));
    }

    public function destroy(Exam $exam, ExamQuestion $question): RedirectResponse
    {
        $question->delete();

        return $this->done($exam, __('Question deleted.'));
    }

    /**
     * Save a new order. The list must name exactly this exam's questions.
     */
    public function sort(Request $request, Exam $exam): RedirectResponse
    {
        $this->reorder($request, $exam->questions());

        return $this->done($exam, __('Questions reordered.'));
    }

    private function done(Exam $exam, string $message): RedirectResponse
    {
        $exam->update(['questions_count' => $exam->questions()->count()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
