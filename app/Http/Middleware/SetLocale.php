<?php

namespace App\Http\Middleware;

use App\Models\Language;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Apply the visitor's chosen interface language, stored in the session by LocaleController.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->session()->get('locale');
        $locale = is_string($locale) && array_key_exists($locale, Language::switchable()) ? $locale : Language::defaultCode();

        app()->setLocale($locale);

        return $next($request);
    }
}
