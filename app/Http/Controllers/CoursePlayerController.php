<?php

namespace App\Http\Controllers;

use App\Enums\LessonContentType;
use App\Enums\LessonType;
use App\Models\CertificateTemplate;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * The course player: the curriculum in a sidebar, one lesson or quiz at a time, and the learner's
 * progress. Open to admins and to students enrolled in the course (the play-course gate).
 */
class CoursePlayerController extends Controller
{
    /**
     * Show a lesson or quiz. Without one, continue at the first item the learner hasn't completed.
     */
    public function show(Request $request, Course $course, ?Lesson $lesson = null): Response|RedirectResponse
    {
        Gate::authorize('play-course', $course);

        $user = $request->user();
        $sections = $course->sections()
            ->with('lessons:id,course_section_id,type,content_type,title,duration_minutes,position')
            ->get(['id', 'course_id', 'title', 'position']);
        $items = $sections->flatMap->lessons->values();
        $completedIds = $user->completedLessons()->whereIn('lessons.id', $items->pluck('id'))->pluck('lessons.id');

        if (! $lesson && $items->isNotEmpty()) {
            $next = $items->first(fn (Lesson $item) => ! $completedIds->contains($item->id)) ?? $items->first();

            return to_route('courses.learn', [$course, $next]);
        }

        $index = $lesson ? $items->search(fn (Lesson $item) => $item->id === $lesson->id) : false;
        $enrollment = $user->enrollments()->whereBelongsTo($course)->first();

        return Inertia::render('courses/player', [
            'course' => $course->only(['id', 'title', 'slug']),
            'sections' => $sections,
            'current' => $lesson ? [
                ...$lesson->only(['id', 'type', 'content_type', 'title', 'duration_minutes', 'body', 'description', 'time_limit_seconds', 'total_mark', 'pass_mark', 'retake_attempts']),
                'src' => $lesson->hasFile() ? route('courses.learn.file', [$course, $lesson]) : ($lesson->videoEmbedUrl() ?? $lesson->source),
                'resources' => $lesson->resources()->get()->map(fn (LessonResource $resource) => [
                    'id' => $resource->id,
                    'title' => $resource->title,
                    'type' => $resource->type,
                    'href' => $resource->isFile() ? route('courses.learn.resource', [$course, $lesson, $resource]) : $resource->resource,
                ]),
                'file_extension' => $lesson->hasFile() ? strtolower(pathinfo($lesson->source, PATHINFO_EXTENSION)) : null,
            ] : null,
            'previousId' => $index !== false ? $items->get($index - 1)?->id : null,
            'nextId' => $index !== false ? $items->get($index + 1)?->id : null,
            'completedIds' => $completedIds,
            'enrolled' => $enrollment !== null,
            'liveClasses' => $course->liveClasses()->get()->map->toSchedule(),
            'finishedAt' => $enrollment?->completed_at,
        ]);
    }

    /**
     * Stream a lesson's uploaded file to someone allowed in the player. Videos support seeking (range
     * requests); documents other than PDF are downloaded with the lesson title as the file name.
     */
    public function file(Course $course, Lesson $lesson): BinaryFileResponse
    {
        Gate::authorize('play-course', $course);
        abort_unless($lesson->hasFile() && Storage::disk('local')->exists($lesson->source), 404);

        $path = Storage::disk('local')->path($lesson->source);
        $extension = pathinfo($path, PATHINFO_EXTENSION);

        if ($lesson->content_type === LessonContentType::Document && $extension !== 'pdf') {
            return response()->download($path, Str::slug($lesson->title).'.'.$extension);
        }

        return response()->file($path);
    }

    /**
     * Download a lesson resource file.
     */
    public function resource(Course $course, Lesson $lesson, LessonResource $resource): BinaryFileResponse
    {
        Gate::authorize('play-course', $course);
        abort_unless($resource->isFile() && Storage::disk('local')->exists($resource->resource), 404);

        $path = Storage::disk('local')->path($resource->resource);

        return response()->download($path, Str::slug($resource->title).'.'.pathinfo($path, PATHINFO_EXTENSION));
    }

    /**
     * Mark a lesson complete, or not complete again. Quizzes are completed by passing them.
     */
    public function complete(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        Gate::authorize('play-course', $course);
        abort_unless($lesson->type === LessonType::Lesson, 422);

        $request->user()->completedLessons()->toggle($lesson);

        return back();
    }

    /**
     * Finish the course once every lesson and quiz is complete.
     */
    public function finish(Request $request, Course $course): RedirectResponse
    {
        Gate::authorize('play-course', $course);

        $user = $request->user();
        $enrollment = $user->enrollments()->whereBelongsTo($course)->firstOrFail();
        $remaining = $course->lessons()->whereNotIn('id', $user->completedLessons()->select('lessons.id'))->exists();

        if ($remaining) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Complete every lesson and quiz first.')]);

            return back();
        }

        $enrollment->completed_at ??= now();
        $enrollment->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Course completed. Well done!')]);

        return back();
    }

    /**
     * The certificate for a finished course, drawn with the active course certificate template.
     */
    public function certificate(Request $request, Course $course): Response
    {
        $enrollment = $request->user()->enrollments()->whereBelongsTo($course)->whereNotNull('completed_at')->first();
        abort_unless($enrollment || $request->user()->isAdmin(), 404);

        $template = CertificateTemplate::activeFor('certificate', 'course');
        abort_unless($template, 404);

        return Inertia::render('courses/certificate', [
            'template' => $template->only(['design', 'colors', 'content']),
            'data' => [
                'recipient' => $request->user()->name,
                'course' => $course->title,
                'date' => ($enrollment?->completed_at ?? now())->locale(app()->getLocale())->isoFormat('LL'),
            ],
            'courseUrl' => route('courses.show', $course),
        ]);
    }
}
