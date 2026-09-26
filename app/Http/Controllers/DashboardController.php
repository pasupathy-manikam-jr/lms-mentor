<?php

namespace App\Http\Controllers;

use App\Enums\CourseStatus;
use App\Enums\UserRole;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Instructor;
use App\Models\Lesson;
use App\Models\PayoutRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the admin overview, or an instructor's own overview. Students have no dashboard yet, so
     * they go back to the site.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $instructor = $user->instructor()->where('status', 'approved')->first();

        if (! $user->isAdmin() && $instructor) {
            return $this->instructorDashboard($instructor);
        }

        if (! $user->isAdmin()) {
            return to_route('home');
        }

        return Inertia::render('dashboard', [
            'role' => 'admin',
            'stats' => [
                'courses' => Course::count(),
                'lessons' => Lesson::lessonsOnly()->count(),
                'enrollments' => Enrollment::count(),
                'students' => User::role(UserRole::Student)->count(),
                'instructors' => Instructor::count(),
            ],
            'revenueByMonth' => $this->revenueByMonth(Enrollment::query(), (100 - config('lms.instructor_revenue_share')) / 100),
            'courseStatus' => collect(CourseStatus::cases())->map(fn (CourseStatus $status) => [
                'status' => $status->value,
                'count' => Course::where('status', $status)->count(),
            ]),
            'pendingWithdrawals' => PayoutRequest::with('instructor:id,name')
                ->where('status', 'pending')
                ->latest()
                ->take(5)
                ->get(['id', 'instructor_id', 'amount', 'status', 'created_at']),
        ]);
    }

    /**
     * The same overview as the admin's (following the Mentor demo), for one instructor's courses: their
     * share of the sales and their own withdrawal requests.
     */
    private function instructorDashboard(Instructor $instructor): Response
    {
        $courseIds = $instructor->courses()->pluck('id');
        $enrollments = Enrollment::whereIn('course_id', $courseIds);

        return Inertia::render('dashboard', [
            'role' => 'instructor',
            'stats' => [
                'courses' => $courseIds->count(),
                'lessons' => Lesson::lessonsOnly()->whereIn('course_id', $courseIds)->count(),
                'enrollments' => (clone $enrollments)->count(),
                'students' => (clone $enrollments)->distinct()->count('user_id'),
            ],
            'revenueByMonth' => $this->revenueByMonth($enrollments, config('lms.instructor_revenue_share') / 100),
            'courseStatus' => collect(CourseStatus::cases())->map(fn (CourseStatus $status) => [
                'status' => $status->value,
                'count' => $instructor->courses()->where('status', $status)->count(),
            ]),
            'pendingWithdrawals' => PayoutRequest::with('instructor:id,name')
                ->whereBelongsTo($instructor)
                ->where('status', 'pending')
                ->latest()
                ->take(5)
                ->get(['id', 'instructor_id', 'amount', 'status', 'created_at']),
        ]);
    }

    /**
     * Revenue for each month of the current year: what students paid for the given enrolments, times a
     * share (the admin's or the instructor's).
     *
     * @param  Builder<Enrollment>  $enrollments
     * @return list<array{month: int, revenue: float}>
     */
    private function revenueByMonth(Builder $enrollments, float $share): array
    {
        // ponytail: grouped in PHP so it works on both MySQL and SQLite; move the grouping into SQL if a year's enrolments grow into the hundreds of thousands.
        $paidByMonth = (clone $enrollments)->whereYear('created_at', now()->year)
            ->where('price_paid', '>', 0)
            ->get(['price_paid', 'created_at'])
            ->groupBy(fn (Enrollment $enrollment) => $enrollment->created_at->month)
            ->map(fn ($enrollments) => $enrollments->sum('price_paid'));

        return collect(range(1, 12))
            ->map(fn (int $month) => [
                'month' => $month,
                'revenue' => round((float) ($paidByMonth[$month] ?? 0) * $share, 2),
            ])
            ->all();
    }
}
