<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * An interface language (Translation). Text comes from lang/{code}.json, with an admin's changes from
 * translation_overrides on top; English is the source text itself.
 *
 * @property int $id
 * @property string $code
 * @property string $name
 * @property string|null $flag
 * @property bool $is_active
 * @property bool $is_default
 */
#[Fillable(['code', 'name', 'flag', 'is_active', 'is_default'])]
class Language extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_default' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget('languages'));
        static::deleted(function (Language $language) {
            Cache::forget('languages');
            TranslationOverride::where('locale', $language->code)->delete();
            Cache::forget("translation_overrides.{$language->code}");
        });
    }

    /**
     * Visitors can switch to these, keyed by code, in the shape the language switcher uses.
     *
     * @return array<string, array{name: string, flag: string|null}>
     */
    public static function switchable(): array
    {
        return self::cached()['active'];
    }

    public static function defaultCode(): string
    {
        return self::cached()['default'];
    }

    /**
     * The whole interface text for a locale: the language file with overrides on top. English has only
     * its overrides. Keyed by the English text.
     *
     * @return array<string, string>
     */
    public static function lines(string $locale): array
    {
        $path = lang_path("{$locale}.json");
        $file = $locale !== 'en' && is_file($path) ? (json_decode((string) file_get_contents($path), true) ?? []) : [];

        return [...$file, ...static::overrides($locale)];
    }

    /**
     * The admin's changes for a locale, cached until the next change (see TranslationOverride).
     *
     * @return array<string, string>
     */
    public static function overrides(string $locale): array
    {
        return Cache::rememberForever("translation_overrides.{$locale}", fn () => TranslationOverride::where('locale', $locale)->pluck('value', 'key')->all());
    }

    /**
     * @return array{active: array<string, array{name: string, flag: string|null}>, default: string}
     */
    private static function cached(): array
    {
        return Cache::rememberForever('languages', function () {
            $languages = static::orderBy('id')->get();

            return [
                'active' => $languages->where('is_active', true)
                    ->mapWithKeys(fn (Language $language) => [$language->code => ['name' => $language->name, 'flag' => $language->flag]])
                    ->all(),
                'default' => $languages->firstWhere('is_default', true)->code ?? 'en',
            ];
        });
    }
}
