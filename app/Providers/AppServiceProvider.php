<?php

namespace App\Providers;

use App\Models\Course;
use App\Models\Exam;
use App\Models\Product;
use App\Models\Setting;
use App\Models\User;
use App\Support\OverridingTranslationLoader;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Translation\Loader;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Admin changes from Translation apply to __() as well as to the pages.
        $this->app->extend('translation.loader', fn (Loader $files) => new OverridingTranslationLoader($files));

        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        // The course player is open to admins and to students whose enrolment hasn't expired.
        Gate::define('play-course', fn (User $user, Course $course): bool => $user->isAdmin()
            || $user->enrollments()->whereBelongsTo($course)->active()->exists());

        $this->applySettings();

        // Short, stable names for what a payment is for (payments.payable_type).
        Relation::morphMap(['course' => Course::class, 'exam' => Exam::class, 'product' => Product::class]);
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Apply what an admin saved in Settings: the site name and the mail server.
     */
    protected function applySettings(): void
    {
        $system = Setting::section('system');

        if (filled($system['site_name'] ?? null)) {
            config(['app.name' => $system['site_name']]);
        }

        $smtp = Setting::section('smtp');

        if (filled($smtp['host'] ?? null)) {
            config([
                'mail.default' => 'smtp',
                'mail.mailers.smtp.host' => $smtp['host'],
                'mail.mailers.smtp.port' => (int) $smtp['port'],
                'mail.mailers.smtp.scheme' => ($smtp['encryption'] ?? null) === 'ssl' ? 'smtps' : 'smtp',
                'mail.mailers.smtp.username' => $smtp['username'] ?? null,
                'mail.mailers.smtp.password' => $smtp['password'] ?? null,
                'mail.from.address' => $smtp['from_address'],
                'mail.from.name' => $smtp['from_name'] ?? config('app.name'),
            ]);
        }
    }
}
