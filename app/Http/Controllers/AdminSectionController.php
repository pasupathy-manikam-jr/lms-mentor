<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class AdminSectionController extends Controller
{
    /**
     * Admin sections that are listed in the sidebar but not built yet. Each gets a "being built" page
     * until its real controller replaces it. Keep in sync with resources/js/lib/admin-nav.ts.
     *
     * @var list<string>
     */
    public const SECTIONS = [
        'ai-assistant',
    ];

    public function __invoke(string $section): Response
    {
        abort_unless(in_array($section, self::SECTIONS, true), 404);

        return Inertia::render('admin/section', ['section' => $section]);
    }
}
