<?php

namespace App\Http\Middleware;

use App\Models\Course;
use App\Models\Exam;
use App\Models\Post;
use App\Models\Product;
use App\Support\ContentOwner;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards dashboard routes shared by admins and instructors: an instructor must be approved, and any
 * course, exam, product or post in the URL must be theirs. Nested routes (curriculum, questions,
 * assets…) are covered because the parent is in the URL too.
 */
class EnsureContentOwner
{
    public function handle(Request $request, Closure $next): Response
    {
        $instructorId = ContentOwner::instructorId();

        if ($instructorId !== null) {
            foreach ($request->route()->parameters() as $model) {
                $owned = match (true) {
                    $model instanceof Course, $model instanceof Exam, $model instanceof Product => $model->instructor_id === $instructorId,
                    $model instanceof Post => $model->user_id === $request->user()->id,
                    default => true,
                };

                abort_unless($owned, 404);
            }
        }

        return $next($request);
    }
}
