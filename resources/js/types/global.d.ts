import type { Auth } from '@/types/auth';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            /** Contact details from Settings → System; any may be missing. */
            site: {
                contact_email?: string;
                contact_phone?: string;
                address?: string;
            };
            /** Current interface language code, e.g. "en". */
            locale: string;
            locales: Record<string, { name: string; flag: string }>;
            /** Interface strings for the current locale, keyed by their English text. */
            translations: Record<string, string>;
            [key: string]: unknown;
        };
    }
}
