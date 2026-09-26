<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Instructor;
use App\Models\Page;
use Inertia\Inertia;
use Inertia\Response;

class AboutController extends Controller
{
    /**
     * Show the About Us page with live catalogue figures and the teaching team.
     */
    public function __invoke(): Response
    {
        return Inertia::render('about', [
            'page' => Page::propsFor('about-us'),
            'stats' => [
                'courses' => Course::approved()->count(),
                'learners' => (int) Course::approved()->sum('students_count'),
                'instructors' => Instructor::count(),
            ],
            'instructors' => Instructor::approved()->orderBy('id')->get(),
        ]);
    }
}
