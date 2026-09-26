<?php

namespace App\Http\Controllers\Admin;

use App\Enums\LessonContentType;
use App\Enums\LessonType;
use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Lesson;
use App\Models\LessonResource;
use App\Support\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * The Curriculum tab of the course editor: sections and the lessons inside them. Routes are scoped,
 * so a section or lesson from another course returns 404.
 */
class CourseCurriculumController extends Controller
{
    public function __construct(private HtmlSanitizer $sanitizer) {}

    public function storeSection(Request $request, Course $course): RedirectResponse
    {
        $validated = $request->validate(['title' => ['required', 'string', 'max:255']]);

        $course->sections()->create([
            'title' => $validated['title'],
            'position' => (int) $course->sections()->max('position') + 1,
        ]);

        return $this->done(__('Section added.'));
    }

    public function updateSection(Request $request, Course $course, CourseSection $section): RedirectResponse
    {
        $section->update($request->validate(['title' => ['required', 'string', 'max:255']]));

        return $this->done(__('Section updated.'));
    }

    /**
     * Delete a section with its lessons, then refresh the course's total duration.
     */
    public function destroySection(Course $course, CourseSection $section): RedirectResponse
    {
        $section->delete();
        $this->syncDuration($course);

        return $this->done(__('Section deleted.'));
    }

    /**
     * Save a new section order. The list must name exactly this course's sections.
     */
    public function sortSections(Request $request, Course $course): RedirectResponse
    {
        $ids = $course->sections()->pluck('id')->all();

        $validated = $request->validate([
            'ids' => ['required', 'array', 'size:'.count($ids)],
            'ids.*' => ['integer', 'distinct', Rule::in($ids)],
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['ids'] as $position => $id) {
                CourseSection::whereKey($id)->update(['position' => $position + 1]);
            }
        });

        return $this->done(__('Sections reordered.'));
    }

    /**
     * Add a lesson or a quiz to the end of a section.
     */
    public function storeLesson(Request $request, Course $course, CourseSection $section): RedirectResponse
    {
        $type = LessonType::from($request->validate(['type' => ['required', Rule::enum(LessonType::class)]])['type']);

        $section->lessons()->create([
            ...$this->itemFields($request, $course, $type),
            'type' => $type,
            'course_id' => $course->id,
            'position' => (int) $section->lessons()->max('position') + 1,
        ]);
        $this->syncDuration($course);

        return $this->done($type === LessonType::Quiz ? __('Quiz added.') : __('Lesson added.'));
    }

    /**
     * Save a new order for a section's lessons and quizzes. The list must name exactly its items.
     */
    public function sortLessons(Request $request, Course $course, CourseSection $section): RedirectResponse
    {
        $ids = $section->lessons()->pluck('id')->all();

        $validated = $request->validate([
            'ids' => ['required', 'array', 'size:'.count($ids)],
            'ids.*' => ['integer', 'distinct', Rule::in($ids)],
        ]);

        DB::transaction(function () use ($validated) {
            foreach ($validated['ids'] as $position => $id) {
                Lesson::whereKey($id)->update(['position' => $position + 1]);
            }
        });

        return $this->done(__('Lessons reordered.'));
    }

    public function updateLesson(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        $lesson->update($this->itemFields($request, $course, $lesson->type, $lesson));
        $this->syncDuration($course);

        return $this->done($lesson->type === LessonType::Quiz ? __('Quiz updated.') : __('Lesson updated.'));
    }

    /**
     * Attach a link or an uploaded file to a lesson.
     */
    public function storeResource(Request $request, Course $course, Lesson $lesson): RedirectResponse
    {
        abort_unless($lesson->type === LessonType::Lesson, 404);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['link', 'file'])],
            'url' => ['exclude_unless:type,link', 'required', 'url:http,https', 'max:2048'],
            'file' => ['exclude_unless:type,file', 'required', 'file', 'max:20480', 'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,csv,txt,zip,jpg,jpeg,png,webp'],
        ]);

        $lesson->resources()->create([
            'title' => $validated['title'],
            'type' => $validated['type'],
            'resource' => $validated['type'] === 'file'
                ? $request->file('file')->store("lessons/{$course->id}/resources", 'local')
                : $validated['url'],
        ]);

        return $this->done(__('Resource added.'));
    }

    public function destroyResource(Course $course, Lesson $lesson, LessonResource $resource): RedirectResponse
    {
        $resource->delete();

        return $this->done(__('Resource deleted.'));
    }

    public function destroyLesson(Course $course, Lesson $lesson): RedirectResponse
    {
        $lesson->delete();
        $this->syncDuration($course);

        return $this->done(__('Lesson deleted.'));
    }

    /**
     * Validated columns for a lesson (title, duration and content) or a quiz (its settings).
     *
     * @return array<string, mixed>
     */
    private function itemFields(Request $request, Course $course, LessonType $type, ?Lesson $lesson = null): array
    {
        return $type === LessonType::Quiz
            ? $this->quizSettings($request)
            : [...$this->validateLesson($request), ...$this->lessonContent($request, $course, $lesson)];
    }

    /**
     * The Add quiz form: title, a time limit in hours/minutes/seconds, marks, retakes and a summary.
     *
     * @return array<string, mixed>
     */
    private function quizSettings(Request $request): array
    {
        $validated = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'hours' => ['required', 'integer', 'min:0', 'max:23'],
            'minutes' => ['required', 'integer', 'min:0', 'max:59'],
            'seconds' => ['required', 'integer', 'min:0', 'max:59'],
            'total_mark' => ['required', 'integer', 'min:1', 'max:1000'],
            'pass_mark' => ['required', 'integer', 'min:0', 'lte:total_mark'],
            'retake_attempts' => ['required', 'integer', 'min:1', 'max:100'],
            'summary' => ['nullable', 'string', 'max:200000'],
        ])->after(function ($validator) use ($request) {
            if (! $validator->errors()->hasAny(['hours', 'minutes', 'seconds'])
                && $request->integer('hours') + $request->integer('minutes') + $request->integer('seconds') === 0) {
                $validator->errors()->add('minutes', __('Set a time limit for the quiz.'));
            }
        })->validate();

        $seconds = $validated['hours'] * 3600 + $validated['minutes'] * 60 + $validated['seconds'];

        return [
            'title' => $validated['title'],
            'time_limit_seconds' => $seconds,
            'duration_minutes' => (int) ceil($seconds / 60),
            'total_mark' => $validated['total_mark'],
            'pass_mark' => $validated['pass_mark'],
            'retake_attempts' => $validated['retake_attempts'],
            'body' => $this->sanitizer->clean($validated['summary'] ?? null),
        ];
    }

    /**
     * @return array{title: string, duration_minutes: int}
     */
    private function validateLesson(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'duration_minutes' => ['required', 'integer', 'min:0', 'max:1440'],
        ]);
    }

    /**
     * Validate and store a lesson's content. A file is required when the lesson becomes a file type,
     * and optional when it already has a file of that type, which is then kept. A replaced file, or one
     * left behind by switching to another type, is deleted.
     *
     * @return array{content_type: LessonContentType, source: ?string, body: ?string, description: ?string}
     */
    private function lessonContent(Request $request, Course $course, ?Lesson $lesson = null): array
    {
        $type = LessonContentType::tryFrom((string) $request->input('content_type'));
        $keepsFile = $lesson?->hasFile() && $lesson->content_type === $type;

        $validated = $request->validate([
            'content_type' => ['required', Rule::enum(LessonContentType::class)],
            'file' => $type?->isFile() ? [$keepsFile ? 'nullable' : 'required', 'file', ...$type->fileRules()] : ['prohibited'],
            'url' => match ($type) {
                LessonContentType::VideoUrl => ['required', 'url:https', 'max:2048', 'regex:~(youtube\.com|youtu\.be|vimeo\.com|\.(mp4|webm)(\?.*)?$)~i'],
                LessonContentType::Embed => ['required', 'url:https', 'max:2048'],
                default => ['nullable'],
            },
            'body' => [$type === LessonContentType::Text ? 'required' : 'nullable', 'string', 'max:200000'],
            'description' => ['nullable', 'string', 'max:2000'],
        ], [
            'url.regex' => __('Use a YouTube or Vimeo link, or a direct link to an MP4 or WebM file.'),
        ]);

        $source = match (true) {
            $request->hasFile('file') => $request->file('file')->store("lessons/{$course->id}", 'local'),
            $keepsFile => $lesson->source,
            $type === LessonContentType::VideoUrl, $type === LessonContentType::Embed => $validated['url'],
            default => null,
        };

        if ($lesson?->hasFile() && $lesson->source !== $source) {
            $lesson->deleteFile();
        }

        return [
            'content_type' => $type,
            'source' => $source,
            'body' => $type === LessonContentType::Text ? $this->sanitizer->clean($validated['body']) : null,
            'description' => $validated['description'] ?? null,
        ];
    }

    /**
     * The course's duration shown in the catalog is the sum of its lessons; quiz time limits don't count.
     */
    private function syncDuration(Course $course): void
    {
        $course->update(['duration_minutes' => (int) $course->lessons()->lessonsOnly()->sum('duration_minutes')]);
    }

    private function done(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
