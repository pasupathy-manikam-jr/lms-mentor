<?php

namespace App\Http\Controllers;

use App\Models\JobOpening;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CareerController extends Controller
{
    /**
     * List open vacancies, soonest deadline first, optionally filtered by title.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        return Inertia::render('careers/index', [
            'page' => Page::propsFor('careers'),
            'jobs' => JobOpening::open()
                ->when($filters['search'] ?? null, fn ($query, $search) => $query->whereLike('title', "%{$search}%"))
                ->orderBy('deadline')
                ->paginate(10, ['id', 'title', 'slug', 'location', 'job_type', 'work_type', 'experience_level', 'positions', 'deadline'])
                ->withQueryString(),
            'filters' => $filters,
        ]);
    }

    /**
     * Show one open vacancy. Closed ones return 404.
     */
    public function show(string $slug): Response
    {
        $job = JobOpening::open()->where('slug', $slug)->firstOrFail();

        return Inertia::render('careers/show', [
            'job' => $job,
            'summary' => Str::limit(trim(preg_replace('/\s+/', ' ', html_entity_decode(strip_tags(str_replace('<', ' <', $job->description))))), 160),
        ]);
    }
}
