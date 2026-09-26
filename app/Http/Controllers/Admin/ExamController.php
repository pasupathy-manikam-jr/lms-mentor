<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ExamStatus;
use App\Enums\QuestionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreExamRequest;
use App\Models\Category;
use App\Models\Exam;
use App\Models\Instructor;
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

/**
 * Manage Exams, Create Exam and the exam editor ("Manage Exam Contents"), following the Mentor demo.
 */
class ExamController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(ExamStatus::class)],
            'sort' => ['nullable', 'in:instructor,questions,enrollments'],
            'direction' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'in:10,20,50'],
        ]);
        $direction = $filters['direction'] ?? 'asc';

        $exams = ContentOwner::scope(Exam::query())
            ->with(['instructor:id,name,title', 'category:id,name'])
            ->withCount('enrollments')
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->whereLike('title', "%{$search}%"))
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when(($filters['sort'] ?? null) === 'instructor', fn ($query) => $query->orderBy(
                Instructor::select('name')->whereColumn('instructors.id', 'exams.instructor_id'),
                $direction,
            ))
            ->when(($filters['sort'] ?? null) === 'questions', fn ($query) => $query->orderBy('questions_count', $direction))
            ->when(($filters['sort'] ?? null) === 'enrollments', fn ($query) => $query->orderBy('enrollments_count', $direction))
            ->orderBy('id')
            ->paginate($filters['per_page'] ?? 10, ['id', 'instructor_id', 'category_id', 'title', 'slug', 'status', 'level', 'price', 'max_attempts', 'questions_count'])
            ->withQueryString();

        return Inertia::render('admin/exams/index', [
            'exams' => $exams,
            'filters' => $filters,
            'statuses' => array_column(ExamStatus::cases(), 'value'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/exams/create', $this->formOptions());
    }

    /**
     * Save a new exam as a draft and open its editor to add questions.
     */
    public function store(StoreExamRequest $request, HtmlSanitizer $sanitizer): RedirectResponse
    {
        $exam = Exam::create([
            ...$this->attributesFrom($request, $sanitizer),
            'slug' => $this->uniqueSlug($request->validated('title')),
            'status' => ExamStatus::Draft,
            'questions_count' => 0,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Exam created. Add its questions next.')]);

        return to_route('admin.exams.edit', $exam);
    }

    public function edit(Exam $exam): Response
    {
        $isDiscounted = $exam->compare_at_price !== null;

        return Inertia::render('admin/exams/edit', [
            ...$this->formOptions(),
            'status' => $exam->status,
            'statuses' => array_column(ExamStatus::cases(), 'value'),
            'slug' => $exam->slug,
            'questions' => $exam->questions()->get(['id', 'type', 'title', 'description', 'options', 'answer', 'marks']),
            'questionTypes' => array_column(QuestionType::cases(), 'value'),
            'exam' => [
                'id' => $exam->id,
                'title' => $exam->title,
                'short_description' => $exam->short_description ?? '',
                'description' => $exam->makeVisible('description')->description ?? '',
                'instructor_id' => (string) ($exam->instructor_id ?? ''),
                'category_id' => (string) $exam->category_id,
                'level' => $exam->level,
                'duration_hours' => (string) intdiv($exam->duration_minutes, 60),
                'duration_minutes' => (string) ($exam->duration_minutes % 60),
                'pass_percentage' => (string) $exam->pass_percentage,
                'max_attempts' => (string) $exam->max_attempts,
                'total_marks' => (string) $exam->total_marks,
                'pricing_type' => (float) $exam->price > 0 || $isDiscounted ? 'paid' : 'free',
                'price' => $isDiscounted ? $exam->compare_at_price : ((float) $exam->price > 0 ? $exam->price : ''),
                'discount' => $isDiscounted,
                'discount_price' => $isDiscounted ? $exam->price : '',
                'expiry_type' => $exam->expiry_type,
                'expiry_months' => (string) ($exam->expiry_months ?? ''),
                'image_url' => $exam->image_url,
                ...collect(['meta_title', 'meta_keywords', 'meta_description', 'og_title', 'og_description'])
                    ->mapWithKeys(fn (string $field) => [$field => $exam->{$field} ?? '']),
            ],
        ]);
    }

    public function update(StoreExamRequest $request, Exam $exam, HtmlSanitizer $sanitizer): RedirectResponse
    {
        $exam->update($this->attributesFrom($request, $sanitizer, $exam));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Exam updated.')]);

        return back();
    }

    public function updateStatus(Request $request, Exam $exam): RedirectResponse
    {
        $exam->update($request->validate(['status' => ['required', Rule::enum(ExamStatus::class)]]));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Exam status updated.')]);

        return back();
    }

    public function destroy(Exam $exam): RedirectResponse
    {
        $this->deleteUpload($exam->image_url);
        $exam->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Exam deleted.')]);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            // Instructors can only put their own name on it.
            'instructors' => Instructor::approved()->when(ContentOwner::instructorId(), fn ($query, $id) => $query->whereKey($id))->orderBy('name')->get(['id', 'name', 'title']),
            'categories' => Category::whereNull('parent_id')->orderBy('position')->get(['id', 'name']),
        ];
    }

    /**
     * Columns from the form. As with courses, a discount keeps the entered price as the struck-through
     * compare-at price and charges the discounted price.
     *
     * @return array<string, mixed>
     */
    private function attributesFrom(StoreExamRequest $request, HtmlSanitizer $sanitizer, ?Exam $exam = null): array
    {
        $validated = $request->validated();
        $isPaid = $validated['pricing_type'] === 'paid';
        $isDiscounted = $isPaid && $request->boolean('discount');
        $attributes = [
            ...Arr::only($validated, ['title', 'short_description', 'instructor_id', 'category_id', 'level', 'pass_percentage', 'max_attempts', 'total_marks', 'expiry_type', 'meta_title', 'meta_keywords', 'meta_description', 'og_title', 'og_description']),
            'instructor_id' => ContentOwner::instructorId() ?? $validated['instructor_id'],
            'description' => $sanitizer->clean($validated['description'] ?? null),
            'duration_minutes' => $validated['duration_hours'] * 60 + $validated['duration_minutes'],
            'price' => $isPaid ? ($isDiscounted ? $validated['discount_price'] : $validated['price']) : 0,
            'compare_at_price' => $isDiscounted ? $validated['price'] : null,
            'expiry_months' => $validated['expiry_type'] === 'limited_time' ? $validated['expiry_months'] : null,
        ];

        if ($request->hasFile('thumbnail')) {
            $attributes['image_url'] = PublicUpload::url($request->file('thumbnail'), 'exams');
        } elseif ($request->boolean('remove_thumbnail') || ! $exam) {
            $attributes['image_url'] = null;
        }

        if ($exam && array_key_exists('image_url', $attributes)) {
            $this->deleteUpload($exam->image_url);
        }

        return $attributes;
    }

    /**
     * Delete a file this app uploaded to the public disk; bundled images are kept.
     */
    private function deleteUpload(?string $url): void
    {
        $prefix = Storage::disk('public')->url('');

        if ($url && str_starts_with($url, $prefix)) {
            Storage::disk('public')->delete(substr($url, strlen($prefix)));
        }
    }

    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'exam';
        $slug = $base;

        for ($i = 2; Exam::where('slug', $slug)->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }
}
