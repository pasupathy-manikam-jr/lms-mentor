<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Application;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Maintenance, following the Mentor demo: put the site into maintenance mode (the admin keeps access
 * through Laravel's secret bypass link), clear caches, and see the system's state.
 */
class MaintenanceController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/maintenance', [
            'isDown' => app()->isDownForMaintenance(),
            'system' => [
                'php' => PHP_VERSION,
                'laravel' => Application::VERSION,
                'environment' => app()->environment(),
                'debug' => (bool) config('app.debug'),
                'queue' => config('queue.default'),
                'pending_jobs' => config('queue.default') === 'database' ? DB::table('jobs')->count() : null,
                'failed_jobs' => DB::table('failed_jobs')->count(),
            ],
        ]);
    }

    /**
     * Turn maintenance mode on or off. Turning it on sends the admin through the secret link, which
     * sets the cookie that lets them keep using the site.
     */
    public function update(Request $request): RedirectResponse
    {
        if ($request->boolean('down')) {
            $secret = Str::random(32);
            Artisan::call('down', ['--secret' => $secret, '--retry' => 60]);

            return redirect("/{$secret}");
        }

        Artisan::call('up');
        Inertia::flash('toast', ['type' => 'success', 'message' => __('The site is live again.')]);

        return to_route('admin.maintenance');
    }

    public function clearCache(): RedirectResponse
    {
        Artisan::call('optimize:clear');
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Caches cleared.')]);

        return back();
    }
}
