<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Instructor;
use App\Models\Page;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    /**
     * Show every instructor with how many courses they teach and how many learners took them.
     */
    public function index(): Response
    {
        return Inertia::render('team/index', [
            'page' => Page::propsFor('our-team'),
            'instructors' => Instructor::approved()->withCount(['courses' => fn ($query) => $query->approved()])
                ->withSum(['courses as learners_count' => fn ($query) => $query->approved()], 'students_count')
                ->orderBy('id')
                ->get(),
        ]);
    }

    /**
     * Show one instructor's profile: totals across their courses, then the courses themselves.
     */
    public function show(Instructor $instructor): Response
    {
        abort_unless($instructor->status === 'approved', 404);

        $courses = $instructor->courses()->approved()->with('category:id,icon')->orderBy('id')->get();
        $reviews = (int) $courses->sum('reviews_count');

        return Inertia::render('team/show', [
            'instructor' => $instructor,
            'courses' => $courses,
            'stats' => [
                'learners' => (int) $courses->sum('students_count'),
                'courses' => $courses->count(),
                'reviews' => $reviews,
                // Weighted by review count, so a course with more reviews counts for more.
                'rating' => $reviews > 0
                    ? round($courses->sum(fn (Course $course) => (float) $course->rating * $course->reviews_count) / $reviews, 1)
                    : null,
            ],
        ]);
    }
}
