<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;

/**
 * Who owns the content the signed-in user manages in the dashboard. Admins manage everything (null);
 * an approved instructor manages only their own courses, exams, products, posts and media. Routes
 * shared with instructors are guarded by the EnsureContentOwner middleware; controllers use this to
 * narrow their lists and to fix the instructor on what an instructor creates.
 */
class ContentOwner
{
    /**
     * The instructor id to limit content to, or null for an admin.
     */
    public static function instructorId(): ?int
    {
        $user = request()->user();

        if (! $user || $user->isAdmin()) {
            return null;
        }

        // Remembered for this request only (once() would outlive the request in long-running workers and tests).
        $request = request();

        if (! $request->attributes->has('content_owner')) {
            $request->attributes->set('content_owner', $user->instructor()->where('status', 'approved')->value('id'));
        }

        return $request->attributes->get('content_owner') ?? abort(403);
    }

    public static function isInstructor(): bool
    {
        return static::instructorId() !== null;
    }

    /**
     * Limit a query to the signed-in instructor's rows (no change for admins).
     *
     * @template TBuilder of Builder
     *
     * @param  TBuilder  $query
     * @return TBuilder
     */
    public static function scope(Builder $query, string $column = 'instructor_id'): Builder
    {
        $id = static::instructorId();

        return $id === null ? $query : $query->where($query->qualifyColumn($column), $id);
    }
}
