<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreJobCircularRequest;
use App\Models\JobOpening;
use App\Support\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Job Circulars, following the Mentor demo: All Jobs, Create Job and Edit Job. Active circulars are
 * listed on the Careers page until their deadline.
 */
class JobCircularController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'in:10,20,50'],
        ]);

        return Inertia::render('admin/job-circulars/index', [
            'jobs' => JobOpening::query()
                ->when($filters['search'] ?? null, fn ($query, $search) => $query->whereLike('title', "%{$search}%"))
                ->latest('id')
                ->paginate($filters['per_page'] ?? 10, ['id', 'title', 'slug', 'status', 'location', 'job_type', 'work_type', 'experience_level', 'positions', 'deadline'])
                ->withQueryString(),
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/job-circulars/form', ['job' => null, ...$this->options()]);
    }

    public function store(StoreJobCircularRequest $request, HtmlSanitizer $sanitizer): RedirectResponse
    {
        JobOpening::create($this->attributesFrom($request, $sanitizer));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Job circular created.')]);

        return to_route('admin.job-circulars.index');
    }

    public function edit(JobOpening $jobOpening): Response
    {
        return Inertia::render('admin/job-circulars/form', [
            'job' => [
                ...$jobOpening->toArray(),
                'deadline' => $jobOpening->deadline->toDateString(),
                'negotiable' => $jobOpening->salary_min === null,
            ],
            ...$this->options(),
        ]);
    }

    public function update(StoreJobCircularRequest $request, JobOpening $jobOpening, HtmlSanitizer $sanitizer): RedirectResponse
    {
        $jobOpening->update($this->attributesFrom($request, $sanitizer, $jobOpening));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Job circular updated.')]);

        return back();
    }

    public function destroy(JobOpening $jobOpening): RedirectResponse
    {
        $jobOpening->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Job circular deleted.')]);

        return back();
    }

    /**
     * @return array<string, list<string>>
     */
    private function options(): array
    {
        return [
            'jobTypes' => JobOpening::JOB_TYPES,
            'workTypes' => JobOpening::WORK_TYPES,
            'experienceLevels' => JobOpening::EXPERIENCE_LEVELS,
            'statuses' => JobOpening::STATUSES,
            'currencies' => StoreJobCircularRequest::CURRENCIES,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function attributesFrom(StoreJobCircularRequest $request, HtmlSanitizer $sanitizer, ?JobOpening $job = null): array
    {
        $validated = $request->validated();
        $isNegotiable = $request->boolean('negotiable');

        return [
            ...collect($validated)->only(['title', 'status', 'apply_email', 'job_type', 'work_type', 'experience_level', 'positions', 'location', 'deadline', 'currency'])->all(),
            'slug' => ($validated['slug'] ?? null) ?: $this->uniqueSlug($validated['title'], $job),
            'description' => $sanitizer->clean($validated['description']),
            'skills' => array_values(array_filter(array_map('trim', $validated['skills'] ?? []))),
            'salary_min' => $isNegotiable ? null : $validated['salary_min'],
            'salary_max' => $isNegotiable ? null : $validated['salary_max'],
        ];
    }

    private function uniqueSlug(string $title, ?JobOpening $job): string
    {
        $base = Str::slug($title) ?: 'job';
        $slug = $base;

        for ($i = 2; JobOpening::where('slug', $slug)->whereKeyNot($job?->id)->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }
}
