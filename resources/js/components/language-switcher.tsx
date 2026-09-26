import { router, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/use-translation';
import { update } from '@/routes/locale';

/**
 * Flag button that switches the interface language for this session.
 */
export function LanguageSwitcher() {
    const { locales } = usePage().props;
    const { t, locale } = useTranslation();
    const current = locales[locale];

    const switchTo = (code: string) =>
        router.post(
            update.url(),
            { locale: code },
            {
                preserveScroll: true,
                onSuccess: () => {
                    document.documentElement.lang = code;
                },
            },
        );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-lg"
                    aria-label={t('Language: :name', {
                        name: current?.name ?? locale,
                    })}
                >
                    <span aria-hidden>{current?.flag}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {Object.entries(locales).map(([code, language]) => (
                    <DropdownMenuItem
                        key={code}
                        onSelect={() => switchTo(code)}
                        lang={code}
                    >
                        <span aria-hidden>{language.flag}</span>
                        {language.name}
                        {code === locale && <Check className="ml-auto" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
