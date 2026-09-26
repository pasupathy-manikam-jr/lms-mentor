<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CourseStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCourseRequest;
use App\Models\Category;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Instructor;
use App\Models\Lesson;
use App\Models\LessonResource;
use App\Support\ContentOwner;
use App\Support\HtmlSanitizer;
use App\Support\PublicUpload;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    /**
     * The course list: search by title, filter by status, sort by instructor name or price.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(CourseStatus::class)],
            'sort' => ['nullable', 'in:name,price'],
            'direction' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'in:10,20,50'],
        ]);

        $direction = $filters['direction'] ?? 'asc';

        $courses = ContentOwner::scope(Course::query())
            ->with(['instructor:id,name,title', 'category:id,name', 'subcategory:id,name'])
            ->withCount(['assignments', 'enrollments'])
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->whereLike('title', "%{$search}%"))
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when(($filters['sort'] ?? null) === 'name', fn ($query) => $query->orderBy(
                Instructor::select('name')->whereColumn('instructors.id', 'courses.instructor_id'),
                $direction,
            ))
            ->when(($filters['sort'] ?? null) === 'price', fn ($query) => $query->orderBy('price', $direction))
            ->orderBy('id')
            ->paginate($filters['per_page'] ?? 10, ['id', 'instructor_id', 'category_id', 'subcategory_id', 'title', 'slug', 'status', 'price'])
            ->withQueryString();

        return Inertia::render('admin/courses/index', [
            'courses' => $courses,
            'filters' => $filters,
            'statuses' => $this->statuses(),
        ]);
    }

    /**
     * The create-course form.
     */
    public function create(): Response
    {
        return Inertia::render('admin/courses/create', $this->formOptions());
    }

    /**
     * Save a new course as a draft.
     */
    public function store(StoreCourseRequest $request, HtmlSanitizer $sanitizer): RedirectResponse
    {
        Course::create([
            ...$this->attributesFrom($request, $sanitizer),
            'slug' => $this->uniqueSlug($request->validated('title')),
            'status' => CourseStatus::Draft,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Course created.')]);

        return to_route('admin.courses.index');
    }

    /**
     * The course editor ("Manage course contents"): curriculum, plus the create form's fields split into
     * tabs. A discounted course shows its compare-at price as the price and its selling price as the
     * discounted price, mirroring how store() saved them.
     */
    public function edit(Course $course): Response
    {
        $isDiscounted = $course->compare_at_price !== null;

        return Inertia::render('admin/courses/edit', [
            ...$this->formOptions(),
            'status' => $course->status,
            'statuses' => $this->statuses(),
            'slug' => $course->slug,
            'info' => $course->infoItems()->get(['id', 'type', 'title', 'body'])->groupBy(fn ($item) => $item->type->value),
            'liveClasses' => $course->liveClasses()->get()->map->toSchedule(),
            'sections' => $course->sections()
                ->with(['lessons:id,course_section_id,type,content_type,source,body,description,title,duration_minutes,time_limit_seconds,total_mark,pass_mark,retake_attempts,position', 'lessons.resources'])
                ->get(['id', 'course_id', 'title', 'position'])
                ->each(fn (CourseSection $section) => $section->setRelation('lessons', $section->lessons->map(fn (Lesson $lesson): array => [
                    ...$lesson->only(['id', 'type', 'content_type', 'title', 'duration_minutes', 'description', 'time_limit_seconds', 'total_mark', 'pass_mark', 'retake_attempts']),
                    'body' => $lesson->body ?? '',
                    // Private file paths stay on the server; the form only needs to know a file exists.
                    'url' => $lesson->hasFile() ? null : $lesson->source,
                    'has_file' => $lesson->hasFile(),
                    'resources' => $lesson->resources->map(fn (LessonResource $resource): array => [
                        ...$resource->only(['id', 'title', 'type']),
                        // Only links expose their target; files stay private.
                        'url' => $resource->isFile() ? null : $resource->resource,
                    ]),
                ]))),
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'short_description' => $course->short_description ?? '',
                'description' => $course->description ?? '',
                'instructor_id' => (string) ($course->instructor_id ?? ''),
                'category_id' => (string) $course->category_id,
                'subcategory_id' => (string) ($course->subcategory_id ?? ''),
                'level' => $course->level,
                'language' => $course->language,
                'pricing_type' => (float) $course->price > 0 || $isDiscounted ? 'paid' : 'free',
                'price' => $isDiscounted ? $course->compare_at_price : ((float) $course->price > 0 ? $course->price : ''),
                'discount' => $isDiscounted,
                'discount_price' => $isDiscounted ? $course->price : '',
                'expiry_type' => $course->expiry_type,
                'expiry_months' => (string) ($course->expiry_months ?? ''),
                'drip_content' => $course->drip_content ? '1' : '0',
                'image_url' => $course->image_url,
                'banner_url' => $course->banner_url,
                'preview_type' => $course->preview_type ?? 'video_url',
                'preview_url' => $course->preview_type === 'video_url' ? $course->preview_source : '',
                'preview_file_url' => $course->preview_type === 'video' ? $course->preview_source : null,
                ...collect(['meta_title', 'meta_keywords', 'meta_description', 'og_title', 'og_description'])
                    ->mapWithKeys(fn (string $field) => [$field => $course->{$field} ?? '']),
            ],
        ]);
    }

    /**
     * Save changes to a course. The slug stays the same so public links keep working, and the
     * thumbnail is only replaced when a new one is uploaded.
     */
    public function update(StoreCourseRequest $request, Course $course, HtmlSanitizer $sanitizer): RedirectResponse
    {
        $course->update($this->attributesFrom($request, $sanitizer, $course));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Course updated.')]);

        return back();
    }

    /**
     * Choices shared by the create form and the editor.
     *
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            // Instructors can only put their own name on a course.
            'instructors' => Instructor::approved()->when(ContentOwner::instructorId(), fn ($query, $id) => $query->whereKey($id))->orderBy('name')->get(['id', 'name', 'title']),
            'categories' => Category::whereNull('parent_id')->orderBy('position')->with('children:id,parent_id,name')->get(['id', 'name']),
            'languages' => config('lms.course_languages'),
        ];
    }

    /**
     * Course columns from the form. With a discount, the entered price becomes the struck-through
     * compare-at price and the discounted price is what students pay.
     *
     * @return array<string, mixed>
     */
    private function attributesFrom(StoreCourseRequest $request, HtmlSanitizer $sanitizer, ?Course $course = null): array
    {
        $validated = $request->validated();
        $isPaid = $validated['pricing_type'] === 'paid';
        $isDiscounted = $isPaid && $request->boolean('discount');

        return [
            'title' => $validated['title'],
            'short_description' => $validated['short_description'] ?? null,
            'description' => $sanitizer->clean($validated['description'] ?? null),
            'instructor_id' => ContentOwner::instructorId() ?? $validated['instructor_id'],
            'category_id' => $validated['category_id'],
            'subcategory_id' => $validated['subcategory_id'] ?? null,
            'level' => $validated['level'],
            'language' => $validated['language'],
            'price' => $isPaid ? ($isDiscounted ? $validated['discount_price'] : $validated['price']) : 0,
            'compare_at_price' => $isDiscounted ? $validated['price'] : null,
            'expiry_type' => $validated['expiry_type'],
            'expiry_months' => $validated['expiry_type'] === 'limited_time' ? $validated['expiry_months'] : null,
            'drip_content' => $validated['drip_content'],
            ...$this->mediaFrom($request, $course),
            // SEO fields only come from the editor's SEO tab; the create form leaves them unset.
            ...Arr::only($validated, ['meta_title', 'meta_keywords', 'meta_description', 'og_title', 'og_description']),
        ];
    }

    /**
     * Thumbnail, banner and preview video. An image left untouched keeps its current value (the key is
     * omitted); a replaced or removed upload is deleted from storage.
     *
     * @return array<string, ?string>
     */
    private function mediaFrom(StoreCourseRequest $request, ?Course $course): array
    {
        $media = [];

        foreach (['thumbnail' => 'image_url', 'banner' => 'banner_url'] as $input => $column) {
            if ($request->hasFile($input)) {
                $media[$column] = PublicUpload::url($request->file($input), 'courses');
            } elseif ($request->boolean("remove_{$input}") || ! $course) {
                $media[$column] = null;
            }

            if ($course && array_key_exists($column, $media)) {
                $this->deleteUpload($course->{$column});
            }
        }

        if (! $request->has('preview_type') && $course) {
            return $media;
        }

        $type = $request->validated('preview_type');
        $source = match ($type) {
            'video_url' => $request->validated('preview_url'),
            'video' => $request->hasFile('preview_file')
                ? PublicUpload::url($request->file('preview_file'), 'courses/previews')
                : ($course?->preview_type === 'video' ? $course->preview_source : null),
            default => null,
        };

        if ($course?->preview_type === 'video' && $course->preview_source !== $source) {
            $this->deleteUpload($course->preview_source);
        }

        return [...$media, 'preview_type' => $source ? $type : null, 'preview_source' => $source];
    }

    /**
     * Delete a file this app uploaded to the public disk. Bundled images (e.g. /images/courses) are kept.
     */
    private function deleteUpload(?string $url): void
    {
        $prefix = Storage::disk('public')->url('');

        if ($url && str_starts_with($url, $prefix)) {
            Storage::disk('public')->delete(substr($url, strlen($prefix)));
        }
    }

    /**
     * Change a course's publication status from the list.
     */
    public function updateStatus(Request $request, Course $course): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in($this->statuses())],
        ]);

        $course->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Course status updated.')]);

        return back();
    }

    /**
     * Delete a course with its lessons and assignments. Courses with enrolled students are kept, so their
     * records are never lost; set those to private instead.
     */
    public function destroy(Course $course): RedirectResponse
    {
        if ($course->enrollments()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('This course has enrolled students, so it cannot be deleted. Set it to private instead.')]);

            return back();
        }

        $course->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Course deleted.')]);

        return back();
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'course';
        $slug = $base;

        for ($i = 2; Course::where('slug', $slug)->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }

    /**
     * Statuses the signed-in user may set. Instructors submit courses for review (pending); publishing
     * (approved or upcoming) is for admins.
     *
     * @return list<string>
     */
    private function statuses(): array
    {
        $statuses = array_column(CourseStatus::cases(), 'value');

        return ContentOwner::isInstructor()
            ? array_values(array_diff($statuses, [CourseStatus::Approved->value, CourseStatus::Upcoming->value]))
            : $statuses;
    }
}
