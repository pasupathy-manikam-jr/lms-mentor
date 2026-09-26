<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class HandleAppearance
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        View::share('appearance', $request->cookie('appearance') ?? 'system');

        // Customizer choices from the Settings panel, applied on first paint. Unknown values are dropped.
        View::share('themeColor', $this->slug($request->cookie('theme_color')));
        View::share('font', $this->slug($request->cookie('font')));
        View::share('direction', $request->cookie('direction') === 'rtl' ? 'rtl' : 'ltr');

        return $next($request);
    }

    /**
     * Keep only simple lowercase slugs, since the value is written into an HTML attribute.
     */
    private function slug(?string $value): ?string
    {
        return $value !== null && preg_match('/^[a-z-]{1,20}$/', $value) ? $value : null;
    }
}
