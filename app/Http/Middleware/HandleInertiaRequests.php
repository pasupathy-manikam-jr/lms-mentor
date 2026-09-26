<?php

namespace App\Http\Middleware;

use App\Models\Language;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                // Spatie role names, e.g. ['admin'], for showing or hiding admin-only UI.
                'roles' => fn () => $request->user()?->getRoleNames() ?? [],
            ],
            // Latest unread notifications for the header bell; empty for guests.
            'notifications' => fn () => $request->user()
                ?->unreadNotifications()
                ->take(10)
                ->get(['id', 'data', 'created_at']) ?? [],
            // Contact details from Settings → System, shown in the site footer.
            'site' => fn () => collect(Setting::section('system'))->only(['contact_email', 'contact_phone', 'address'])->all(),
            'locale' => app()->getLocale(),
            'locales' => Language::switchable(),
            'translations' => fn () => Language::lines(app()->getLocale()),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
