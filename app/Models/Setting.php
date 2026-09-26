<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * One Settings section (system, smtp, auth, analytics) stored as encrypted JSON, so the mail password
 * and similar secrets are never readable in the database.
 *
 * @property int $id
 * @property string $section
 * @property array<string, mixed> $values
 */
#[Fillable(['section', 'values'])]
class Setting extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'values' => 'encrypted:array',
        ];
    }

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget('settings'));
    }

    /**
     * A section's saved values, or [] (also before migrations have run).
     *
     * @return array<string, mixed>
     */
    public static function section(string $section): array
    {
        try {
            return Cache::rememberForever('settings', fn () => static::all()->mapWithKeys(fn (Setting $setting) => [$setting->section => $setting->values])->all())[$section] ?? [];
        } catch (Throwable) {
            return [];
        }
    }

    /**
     * Merge values into a section.
     *
     * @param  array<string, mixed>  $values
     */
    public static function put(string $section, array $values): void
    {
        $setting = static::firstOrNew(['section' => $section]);
        $setting->values = [...($setting->values ?? []), ...$values];
        $setting->save();
    }
}
