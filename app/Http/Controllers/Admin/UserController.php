<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * All Users, following the Mentor demo: every account with its status and role, edited in a dialog.
 * Admins can't deactivate, demote or delete their own account.
 */
class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', Rule::enum(UserRole::class)],
            'per_page' => ['nullable', 'integer', 'in:10,20,50'],
        ]);

        $users = User::query()
            ->with('roles:id,name')
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query
                ->whereLike('name', "%{$search}%")
                ->orWhereLike('email', "%{$search}%")))
            ->when($filters['role'] ?? null, fn ($query, $role) => $query->role($role))
            ->latest('id')
            ->paginate($filters['per_page'] ?? 10, ['id', 'name', 'email', 'is_active', 'created_at'])
            ->withQueryString()
            ->through(fn (User $user) => [
                ...$user->only(['id', 'name', 'email', 'is_active', 'created_at']),
                'role' => $user->roles->first()?->name ?? UserRole::Student->value,
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => $filters,
            'roles' => array_column(UserRole::cases(), 'value'),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'role' => ['required', Rule::enum(UserRole::class)],
            'is_active' => ['boolean'],
        ]);

        $isSelf = $user->is($request->user());

        if ($isSelf && ($validated['role'] !== UserRole::Admin->value || ! $request->boolean('is_active'))) {
            throw ValidationException::withMessages(['role' => __('You cannot deactivate or demote your own account.')]);
        }

        $user->forceFill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'is_active' => $request->boolean('is_active'),
        ])->save();
        $user->syncRoles([$validated['role']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User updated.')]);

        return back();
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        abort_if($user->is($request->user()), 403);

        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User deleted.')]);

        return back();
    }
}
