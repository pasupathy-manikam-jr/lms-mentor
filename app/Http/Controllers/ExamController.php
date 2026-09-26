<?php

namespace App\Http\Controllers;

use App\Enums\ExamStatus;
use App\Models\Category;
use App\Models\Exam;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    /**
     * Show the exam catalog, filtered by search, category, price and level.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'exists:categories,slug'],
            'price' => ['nullable', 'in:free,paid'],
            'level' => ['nullable', 'in:beginner,intermediate,advanced'],
        ]);

        $exams = Exam::published()->with(['category:id,icon', 'instructor:id,name'])
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->whereLike('title', "%{$search}%"))
            ->when($filters['category'] ?? null, fn ($query, $slug) => $query->whereRelation('category', 'slug', $slug))
            ->when(($filters['price'] ?? null) === 'free', fn ($query) => $query->where('price', 0))
            ->when(($filters['price'] ?? null) === 'paid', fn ($query) => $query->where('price', '>', 0))
            ->when($filters['level'] ?? null, fn ($query, $level) => $query->where('level', $level))
            ->orderBy('id')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('exams/index', [
            'exams' => $exams,
            'categories' => Category::listedFor('exams', 'published'),
            'filters' => $filters,
        ]);
    }

    /**
     * Show one exam with a few others from the same category. Admins can also preview unpublished exams.
     */
    public function show(Request $request, Exam $exam): Response
    {
        abort_unless($exam->status === ExamStatus::Published || $request->user()?->isAdmin(), 404);

        return Inertia::render('exams/show', [
            // owned, pending (offline payment awaiting approval) or null.
            'ownership' => $request->user() ? Payment::ownership($request->user(), $exam) : null,
            'attempts' => $request->user() ? [
                'used' => $request->user()->examAttempts()->whereBelongsTo($exam)->count(),
                'max' => $exam->max_attempts,
                'passed' => $request->user()->examAttempts()->whereBelongsTo($exam)->where('passed', true)->exists(),
                'last_id' => $request->user()->examAttempts()->whereBelongsTo($exam)->latest('id')->value('id'),
                'in_progress' => $request->user()->examAttempts()->whereBelongsTo($exam)->whereNull('submitted_at')->where('ends_at', '>', now())->exists(),
            ] : null,
            'exam' => $exam->load(['category', 'instructor'])->makeVisible('description'),
            'relatedExams' => Exam::published()->with(['category:id,icon', 'instructor:id,name'])
                ->whereBelongsTo($exam->category)
                ->whereKeyNot($exam->id)
                ->orderBy('id')
                ->take(3)
                ->get(),
            'categories' => Category::listedFor('exams', 'published'),
        ]);
    }
}
