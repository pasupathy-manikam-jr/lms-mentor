<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Course;
use App\Models\Instructor;
use App\Models\Page;
use App\Models\Post;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    /**
     * Show the public landing page.
     */
    public function __invoke(): Response
    {
        $collections = Page::firstWhere('slug', 'home')->collections ?? [];

        return Inertia::render('welcome', [
            'page' => Page::propsFor('home'),
            'categories' => Category::listedFor('courses', 'approved', 'courses_count'),
            'popularCourses' => Course::approved()->with('category:id,icon')->where('is_popular', true)->orderBy('id')->take(8)->get(),
            'latestCourses' => Course::approved()->with('category:id,icon')->latest()->latest('id')->take(8)->get(),
            'instructors' => $this->picked(Instructor::approved()->orderBy('id'), $collections['instructors'] ?? []),
            'posts' => $this->picked(Post::published()->latest('published_at')->take(6), $collections['posts'] ?? []),
        ]);
    }

    /**
     * A home page list: the items picked in Frontend → Home collections, in the picked order, or the
     * automatic list when nothing is picked.
     *
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @param  list<int>  $ids
     * @return Collection<int, TModel>
     */
    private function picked(Builder $query, array $ids): Collection
    {
        if ($ids === []) {
            return $query->get();
        }

        return $query->reorder()->limit(count($ids))->whereKey($ids)->get()
            ->sortBy(fn (Model $model) => array_search($model->getKey(), $ids))
            ->values();
    }
}
