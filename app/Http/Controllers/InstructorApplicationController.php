<?php

namespace App\Http\Controllers;

use App\Http\Requests\InstructorProfileRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Become an instructor": a signed-in user applies to teach. The application waits in Instructors →
 * Applications until an admin approves or rejects it; a rejected user can apply again.
 */
class InstructorApplicationController extends Controller
{
    public function show(Request $request): Response
    {
        $instructor = $request->user()->instructor()->first();

        return Inertia::render('instructor-application', [
            'application' => $instructor?->only(['status', 'title', 'skills', 'biography', 'resume_name']),
        ]);
    }

    public function store(InstructorProfileRequest $request): RedirectResponse
    {
        $user = $request->user();
        $instructor = $user->instructor()->first();

        abort_if($instructor && $instructor->status !== 'rejected', 403);

        $previousResume = $instructor?->resume_path;
        $user->instructor()->updateOrCreate([], [...$request->profile(), 'name' => $user->name, 'status' => 'pending']);

        if ($previousResume) {
            Storage::disk('local')->delete($previousResume);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Application sent. We will let you know once it has been reviewed.')]);

        return back();
    }
}
