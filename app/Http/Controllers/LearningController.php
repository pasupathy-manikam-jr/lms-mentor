<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\ExamEnrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A learner's own pages from the avatar menu, following the Mentor demo: My Courses (with progress)
 * and the Wishlist.
 */
class LearningController extends Controller
{
    public function courses(Request $request): Response
    {
        $user = $request->user();
        $completed = $user->completedLessons()->pluck('lessons.id')->flip();

        return Inertia::render('learning/courses', [
            'courses' => $user->enrollments()
                ->with(['course' => fn ($query) => $query->select(['id', 'title', 'slug', 'image_url', 'instructor_id'])
                    ->with('instructor:id,name')
                    ->with('lessons:id,course_id')])
                ->latest()
                ->get()
                ->filter(fn (Enrollment $enrollment) => $enrollment->course !== null)
                ->map(fn (Enrollment $enrollment) => [
                    'id' => $enrollment->id,
                    'course' => $enrollment->course->only(['title', 'slug', 'image_url']) + ['instructor' => $enrollment->course->instructor?->name],
                    'total' => $total = $enrollment->course->lessons->count(),
                    'done' => $done = $enrollment->course->lessons->filter(fn ($lesson) => $completed->has($lesson->id))->count(),
                    'progress' => $total > 0 ? (int) round($done / $total * 100) : 0,
                    'completed' => $enrollment->completed_at !== null,
                    'expired' => $enrollment->expires_at?->isPast() ?? false,
                ])
                ->values(),
            'exams' => $user->examEnrollments()->with('exam:id,title,slug,image_url')->latest()->get()
                ->filter(fn (ExamEnrollment $enrollment) => $enrollment->exam !== null)
                ->map(fn (ExamEnrollment $enrollment) => $enrollment->exam->only(['title', 'slug', 'image_url']) + [
                    'passed' => $user->examAttempts()->where('exam_id', $enrollment->exam_id)->where('passed', true)->exists(),
                ])
                ->values(),
        ]);
    }

    public function wishlist(Request $request): Response
    {
        return Inertia::render('learning/wishlist', [
            'courses' => $request->user()->wishlist()->approved()->with('category:id,icon')->latest('wishlists.created_at')->get(),
        ]);
    }

    /**
     * Add a course to the wishlist, or take it off if it is already there.
     */
    public function toggleWishlist(Request $request, Course $course): RedirectResponse
    {
        $changes = $request->user()->wishlist()->toggle($course->id);

        Inertia::flash('toast', ['type' => 'success', 'message' => $changes['attached'] ? __('Saved to your wishlist.') : __('Removed from your wishlist.')]);

        return back();
    }
}
