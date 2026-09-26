<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\TestMail;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Settings, following the Mentor demo: System, Storage, SMTP, Auth and Analytics (Google Analytics and
 * Meta Pixel). Values are applied when the app starts (AppServiceProvider::applySettings).
 */
class SettingsController extends Controller
{
    public const SECTIONS = ['system', 'storage', 'smtp', 'auth', 'analytics'];

    public function show(string $section): Response
    {
        abort_unless(in_array($section, self::SECTIONS, true), 404);

        $values = Setting::section($section);

        return Inertia::render('admin/settings/index', [
            'section' => $section,
            'values' => match ($section) {
                'system' => [
                    'site_name' => $values['site_name'] ?? config('app.name'),
                    'contact_email' => $values['contact_email'] ?? '',
                    'contact_phone' => $values['contact_phone'] ?? '',
                    'address' => $values['address'] ?? '',
                ],
                // The password is never sent back; a blank field keeps it.
                'smtp' => [...collect($values)->except('password')->all(), 'has_password' => filled($values['password'] ?? null)],
                'auth' => ['registration_open' => $values['registration_open'] ?? true],
                'analytics' => [
                    'google_analytics_id' => $values['google_analytics_id'] ?? '',
                    'meta_pixel_id' => $values['meta_pixel_id'] ?? '',
                ],
                'storage' => [
                    'disk' => config('filesystems.default'),
                    'public_url' => config('filesystems.disks.public.url'),
                ],
            },
            'mailer' => config('mail.default'),
        ]);
    }

    public function update(Request $request, string $section): RedirectResponse
    {
        abort_unless(in_array($section, ['system', 'smtp', 'auth', 'analytics'], true), 404);

        $validated = match ($section) {
            'system' => $request->validate([
                'site_name' => ['required', 'string', 'max:100'],
                'contact_email' => ['nullable', 'email', 'max:255'],
                'contact_phone' => ['nullable', 'string', 'max:50'],
                'address' => ['nullable', 'string', 'max:500'],
            ]),
            'smtp' => $request->validate([
                'host' => ['required', 'string', 'max:255'],
                'port' => ['required', 'integer', 'between:1,65535'],
                'encryption' => ['required', Rule::in(['tls', 'ssl'])],
                'username' => ['nullable', 'string', 'max:255'],
                'password' => ['nullable', 'string', 'max:255'],
                'from_address' => ['required', 'email', 'max:255'],
                'from_name' => ['required', 'string', 'max:100'],
            ]),
            'auth' => ['registration_open' => $request->boolean('registration_open')],
            // Strict formats, because these IDs are written into every page's <head>.
            'analytics' => $request->validate([
                'google_analytics_id' => ['nullable', 'string', 'regex:/^G-[A-Z0-9]{4,20}$/'],
                'meta_pixel_id' => ['nullable', 'string', 'regex:/^\d{6,20}$/'],
            ]),
        };

        if ($section === 'smtp' && blank($validated['password'] ?? null)) {
            unset($validated['password']);
        }

        Setting::put($section, $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Settings saved.')]);

        return back();
    }

    /**
     * Send a test email to the signed-in admin with the saved mail settings.
     */
    public function testMail(Request $request): RedirectResponse
    {
        try {
            Mail::to($request->user())->send(new TestMail);
        } catch (Throwable $exception) {
            return back()->withErrors(['test' => __('The test email could not be sent: :error', ['error' => $exception->getMessage()])]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Test email sent to :email.', ['email' => $request->user()->email])]);

        return back();
    }
}
