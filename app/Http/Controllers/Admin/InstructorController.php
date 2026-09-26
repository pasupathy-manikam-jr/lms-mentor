<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\InstructorProfileRequest;
use App\Models\Exam;
use App\Models\Instructor;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * The Instructors section, following the Mentor demo: Manage Instructors, Create Instructor and
 * Applications. Approving an application gives the user the instructor role.
 */
class InstructorController extends Controller
{
    public function index(Request $request): Response
    {
        return $this->list($request, 'admin/instructors/index', ['approved'], ['view' => 'instructors']);
    }

    public function applications(Request $request): Response
    {
        $status = $request->validate(['status' => ['nullable', Rule::in(['pending', 'rejected'])]])['status'] ?? 'pending';

        return $this->list($request, 'admin/instructors/index', [$status], ['view' => 'applications', 'status' => $status]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/instructors/form', [
            'instructor' => null,
            'users' => User::whereDoesntHave('instructor')->orderBy('name')->get(['id', 'name', 'email']),
        ]);
    }

    public function store(InstructorProfileRequest $request): RedirectResponse
    {
        $user = User::findOrFail($request->integer('user_id'));

        $user->instructor()->create([...$request->profile(), 'name' => $user->name, 'status' => 'approved']);
        $user->assignRole(UserRole::Instructor->value);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Instructor created.')]);

        return to_route('admin.instructors.index');
    }

    public function edit(Instructor $instructor): Response
    {
        return Inertia::render('admin/instructors/form', [
            'instructor' => [
                ...$instructor->only(['id', 'name', 'title', 'skills', 'biography', 'resume_name', 'status']),
                'user' => $instructor->user?->only(['id', 'name', 'email']),
            ],
            'users' => [],
        ]);
    }

    public function update(InstructorProfileRequest $request, Instructor $instructor): RedirectResponse
    {
        $previousResume = $instructor->resume_path;
        $instructor->update([...$request->profile(), 'name' => $request->validated('name')]);

        if ($previousResume && $previousResume !== $instructor->resume_path) {
            Storage::disk('local')->delete($previousResume);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Instructor updated.')]);

        return back();
    }

    /**
     * Approve, reject or return an instructor to pending; only approved instructors keep the instructor role.
     */
    public function updateStatus(Request $request, Instructor $instructor): RedirectResponse
    {
        $status = $request->validate(['status' => ['required', Rule::in(Instructor::STATUSES)]])['status'];
        $instructor->update(['status' => $status]);

        if ($instructor->user) {
            $status === 'approved'
                ? $instructor->user->assignRole(UserRole::Instructor->value)
                : $instructor->user->removeRole(UserRole::Instructor->value);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Instructor status updated.')]);

        return back();
    }

    /**
     * Instructors who still teach something are kept; reassign their courses, exams and products first.
     */
    public function destroy(Instructor $instructor): RedirectResponse
    {
        if ($this->teaches($instructor)) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('This instructor still has courses, exams or products. Reassign them first.')]);

            return back();
        }

        $instructor->user?->removeRole(UserRole::Instructor->value);
        $instructor->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Instructor deleted.')]);

        return back();
    }

    public function resume(Instructor $instructor): StreamedResponse
    {
        abort_unless($instructor->resume_path !== null, 404);

        return Storage::disk('local')->download($instructor->resume_path, $instructor->resume_name);
    }

    /**
     * @param  list<string>  $statuses
     * @param  array<string, mixed>  $extra
     */
    private function list(Request $request, string $component, array $statuses, array $extra = []): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'in:10,20,50'],
        ]);

        $instructors = Instructor::query()
            ->whereIn('status', $statuses)
            ->with('user:id,email')
            ->withCount('courses')
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query
                ->whereLike('name', "%{$search}%")
                ->orWhereRelation('user', 'email', 'like', "%{$search}%")))
            ->orderBy('name')
            ->paginate($filters['per_page'] ?? 10, ['id', 'user_id', 'status', 'name', 'title', 'avatar_url', 'resume_name', 'created_at'])
            ->withQueryString();

        return Inertia::render($component, ['instructors' => $instructors, 'filters' => $filters, ...$extra]);
    }

    private function teaches(Instructor $instructor): bool
    {
        return $instructor->courses()->exists()
            || Exam::whereBelongsTo($instructor)->exists()
            || Product::whereBelongsTo($instructor)->exists();
    }
}
