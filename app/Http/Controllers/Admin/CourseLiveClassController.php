<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\LiveClass;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

/**
 * The Live class tab of the course editor. The browser sends start times as ISO 8601 with its offset,
 * and they are stored in UTC.
 */
class CourseLiveClassController extends Controller
{
    public function store(Request $request, Course $course): RedirectResponse
    {
        $course->liveClasses()->create($this->validated($request));

        return $this->done(__('Live class scheduled.'));
    }

    public function update(Request $request, Course $course, LiveClass $liveClass): RedirectResponse
    {
        $liveClass->update($this->validated($request));

        return $this->done(__('Live class updated.'));
    }

    public function destroy(Course $course, LiveClass $liveClass): RedirectResponse
    {
        $liveClass->delete();

        return $this->done(__('Live class deleted.'));
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $validated = $request->validate([
            'topic' => ['required', 'string', 'max:255'],
            'starts_at' => ['required', 'date'],
            'meeting_url' => ['required', 'url:https', 'max:2048'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        return [...$validated, 'starts_at' => Carbon::parse($validated['starts_at'])->utc()];
    }

    private function done(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
