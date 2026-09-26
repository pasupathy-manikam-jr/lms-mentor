<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CourseInfoType;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseInfoItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * The Info tab of the course editor: FAQs, requirements and outcomes. New items go to the end of their
 * list.
 */
class CourseInfoController extends Controller
{
    public function store(Request $request, Course $course): RedirectResponse
    {
        $type = CourseInfoType::from($request->validate(['type' => ['required', Rule::enum(CourseInfoType::class)]])['type']);

        $course->infoItems()->create([
            ...$this->validated($request, $type),
            'type' => $type,
            'position' => (int) $course->infoItems()->where('type', $type)->max('position') + 1,
        ]);

        return $this->done(__('Saved.'));
    }

    public function update(Request $request, Course $course, CourseInfoItem $infoItem): RedirectResponse
    {
        $infoItem->update($this->validated($request, $infoItem->type));

        return $this->done(__('Saved.'));
    }

    public function destroy(Course $course, CourseInfoItem $infoItem): RedirectResponse
    {
        $infoItem->delete();

        return $this->done(__('Removed.'));
    }

    /**
     * @return array{title: string, body: ?string}
     */
    private function validated(Request $request, CourseInfoType $type): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:500'],
            'body' => [$type === CourseInfoType::Faq ? 'required' : 'prohibited', 'nullable', 'string', 'max:5000'],
        ]);

        return ['title' => $validated['title'], 'body' => $validated['body'] ?? null];
    }

    private function done(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
