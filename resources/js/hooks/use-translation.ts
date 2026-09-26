import { usePage } from '@inertiajs/react';

/** Region-specific Intl locales for number, currency and date formatting. */
const INTL_LOCALES: Record<string, string> = {
    en: 'en-IN',
    ms: 'ms-MY',
    zh: 'zh-CN',
};

/**
 * Interface translation. Keys are the English text, so an untranslated string simply shows in English.
 * Placeholders use Laravel's syntax: t('Showing :from to :to', { from: 1, to: 9 }).
 */
export function useTranslation() {
    const { translations, locale } = usePage().props;

    // Match whole placeholder names, so :to never eats the start of :total.
    const t = (key: string, replace: Record<string, string | number> = {}) =>
        (translations[key] ?? key).replace(/:([A-Za-z_]+)/g, (match, name) =>
            name in replace ? String(replace[name]) : match,
        );

    return { t, locale, intlLocale: INTL_LOCALES[locale] ?? locale };
}
