<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Exam;
use App\Models\ExamEnrollment;
use App\Models\User;
use App\Support\ContentOwner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Course Enrollments and Exam Enrollments: every enrolment, and manual enrolment by an admin (the demo's
 * "Add Enrollment"). The route's `scope` default says which kind a page manages. A paid enrolment
 * records the item's current price as revenue; a free one records 0.
 */
class EnrollmentController extends Controller
{
    public function index(Request $request): Response
    {
        $scope = $this->scope($request);
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'in:10,20,50'],
        ]);

        $enrollments = $this->model($scope)::query()
            ->when(ContentOwner::instructorId(), fn ($query, $id) => $query->whereRelation($scope, 'instructor_id', $id))
            ->with(['user:id,name,email', "{$scope}:id,title,slug"])
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query
                ->whereHas('user', fn ($query) => $query->whereLike('name', "%{$search}%")->orWhereLike('email', "%{$search}%"))
                ->orWhereHas($scope, fn ($query) => $query->whereLike('title', "%{$search}%"))))
            ->latest()
            ->latest('id')
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString()
            ->through(fn (Enrollment|ExamEnrollment $enrollment) => [
                'id' => $enrollment->id,
                'user' => $enrollment->user->only(['id', 'name', 'email']),
                'item' => $enrollment->{$scope}->only(['id', 'title', 'slug']),
                'price_paid' => $enrollment->price_paid,
                'enrolled_at' => $enrollment->created_at->toIso8601String(),
                'expires_at' => $enrollment->expires_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/course-enrollments/index', [
            'scope' => $scope,
            'enrollments' => $enrollments,
            'filters' => $filters,
            // Only admins add or remove enrolments, so only they get the people list for the dialog.
            'canManage' => ! ContentOwner::isInstructor(),
            'users' => ContentOwner::isInstructor() ? [] : User::orderBy('name')->get(['id', 'name', 'email']),
            'items' => ContentOwner::scope($scope === 'exam' ? Exam::query() : Course::query())->orderBy('title')->get(['id', 'title', 'price']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $scope = $this->scope($request);
        $table = $scope === 'exam' ? 'exams' : 'courses';

        $validated = $request->validate([
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'item_id' => ['required', 'integer', Rule::exists($table, 'id'), Rule::unique((new ($this->model($scope)))->getTable(), "{$scope}_id")->where('user_id', $request->integer('user_id'))],
            'enrollment_type' => ['required', Rule::in(['free', 'paid'])],
        ], [
            'item_id.unique' => $scope === 'exam' ? __('This user is already enrolled in this exam.') : __('This user is already enrolled in this course.'),
        ], ['item_id' => $scope === 'exam' ? __('exam') : __('course')]);

        $item = ($scope === 'exam' ? Exam::query() : Course::query())->findOrFail($request->integer('item_id'));

        $this->model($scope)::create([
            'user_id' => $validated['user_id'],
            "{$scope}_id" => $item->id,
            'price_paid' => $validated['enrollment_type'] === 'paid' ? $item->price : 0,
            'expires_at' => $item->accessEndsAt(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Enrollment added.')]);

        return back();
    }

    /**
     * Remove an enrolment. For courses the learner loses access; their completed-lesson history is kept
     * in case they are enrolled again.
     */
    public function destroy(Request $request, int $enrollment): RedirectResponse
    {
        $this->model($this->scope($request))::findOrFail($enrollment)->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Enrollment removed.')]);

        return back();
    }

    /**
     * course or exam, from the route.
     */
    private function scope(Request $request): string
    {
        return $request->route()->defaults['scope'];
    }

    /**
     * @return class-string<Enrollment|ExamEnrollment>
     */
    private function model(string $scope): string
    {
        return $scope === 'exam' ? ExamEnrollment::class : Enrollment::class;
    }
}
