<?php

namespace App\Http\Controllers;

use App\Enums\CourseStatus;
use App\Models\Category;
use App\Models\Course;
use App\Models\Payment;
use App\Support\VideoEmbed;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    /**
     * Show the course catalog, filtered by search, category, price and level.
     */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'exists:categories,slug'],
            'price' => ['nullable', 'in:free,paid'],
            'level' => ['nullable', 'in:beginner,intermediate,advanced'],
        ]);

        $courses = Course::approved()
            ->with('category:id,icon')
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->whereLike('title', "%{$search}%"))
            ->when($filters['category'] ?? null, fn ($query, $slug) => $query->whereRelation('category', 'slug', $slug))
            ->when(($filters['price'] ?? null) === 'free', fn ($query) => $query->where('price', 0))
            ->when(($filters['price'] ?? null) === 'paid', fn ($query) => $query->where('price', '>', 0))
            ->when($filters['level'] ?? null, fn ($query, $level) => $query->where('level', $level))
            ->orderBy('id')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('courses/index', [
            'courses' => $courses,
            'categories' => Category::listedFor('courses', fn ($query) => $query->approved()),
            'filters' => $filters,
        ]);
    }

    /**
     * Show one course with a few others from the same category. Admins can also preview unpublished courses.
     */
    public function show(Request $request, Course $course): Response
    {
        abort_unless($course->status === CourseStatus::Approved || $request->user()?->isAdmin(), 404);

        return Inertia::render('courses/show', [
            // owned, pending (offline payment awaiting approval) or null.
            'ownership' => $request->user() ? Payment::ownership($request->user(), $course) : null,
            'wishlisted' => (bool) $request->user()?->wishlist()->whereKey($course->id)->exists(),
            'course' => $course->load(['category', 'instructor'])->makeVisible('description'),
            'preview' => match ($course->preview_type) {
                'video_url' => ['type' => 'embed', 'src' => VideoEmbed::url((string) $course->preview_source)],
                'video' => ['type' => 'video', 'src' => $course->preview_source],
                default => null,
            },
            'info' => $course->infoItems()->get(['id', 'type', 'title', 'body'])->groupBy(fn ($item) => $item->type->value),
            'relatedCourses' => Course::approved()
                ->with('category:id,icon')
                ->whereBelongsTo($course->category)
                ->whereKeyNot($course->id)
                ->orderBy('id')
                ->take(3)
                ->get(),
            'categories' => Category::listedFor('courses', fn ($query) => $query->approved()),
        ]);
    }
}
