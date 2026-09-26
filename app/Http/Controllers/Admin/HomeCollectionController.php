<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Instructor;
use App\Models\Page;
use App\Models\Post;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Frontend → Home collections (the demo's Page API): which courses, instructors and blog posts the
 * home page shows. Popular courses are the courses flagged is_popular; instructors and posts are
 * stored on the home page row, and nothing picked means the automatic list.
 */
class HomeCollectionController extends Controller
{
    public function index(): Response
    {
        $collections = Page::firstWhere('slug', 'home')->collections ?? [];

        return Inertia::render('admin/pages/collections', [
            'courses' => Course::approved()->orderBy('title')->get(['id', 'title', 'image_url', 'is_popular']),
            'instructors' => Instructor::approved()->orderBy('name')->get(['id', 'name', 'title', 'avatar_url']),
            'posts' => Post::published()->latest('published_at')->get(['id', 'title', 'image_url', 'published_at']),
            'picked' => [
                'courses' => Course::where('is_popular', true)->orderBy('id')->pluck('id'),
                'instructors' => $collections['instructors'] ?? [],
                'posts' => $collections['posts'] ?? [],
            ],
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'courses' => ['present', 'array', 'max:8'],
            'courses.*' => ['integer', 'distinct', Rule::exists('courses', 'id')],
            'instructors' => ['present', 'array', 'max:12'],
            'instructors.*' => ['integer', 'distinct', Rule::exists('instructors', 'id')],
            'posts' => ['present', 'array', 'max:6'],
            'posts.*' => ['integer', 'distinct', Rule::exists('posts', 'id')],
        ]);

        Course::where('is_popular', true)->whereKeyNot($validated['courses'])->update(['is_popular' => false]);
        Course::whereKey($validated['courses'])->update(['is_popular' => true]);

        Page::where('slug', 'home')->firstOrFail()->update(['collections' => [
            'instructors' => array_map('intval', $validated['instructors']),
            'posts' => array_map('intval', $validated['posts']),
        ]]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Home page collections saved.')]);

        return back();
    }
}
