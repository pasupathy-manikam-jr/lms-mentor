<?php

namespace App\Http\Controllers;

use App\Models\Page;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    /**
     * A custom page from Frontend → Pages. Unpublished pages are visible only to admins.
     */
    public function show(Request $request, Page $page): Response
    {
        abort_if($page->isBuiltIn(), 404);
        abort_unless($page->is_published || $request->user()?->isAdmin(), 404);

        return Inertia::render('page', [
            'page' => $page->only(['title', 'body', 'meta_title', 'meta_description', 'og_image_url']),
        ]);
    }
}
