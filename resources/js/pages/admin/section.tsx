import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { findAdminNav } from '@/lib/admin-nav';
import { dashboard } from '@/routes';
import { section as adminSection } from '@/routes/admin';

/**
 * Placeholder for an admin section that is in the sidebar but not built yet.
 */
export default function AdminSection({
    section,
    title: explicitTitle,
}: {
    section: string;
    /** Set by pages that open a specific record, e.g. the course being edited. */
    title?: string;
}) {
    const { t } = useTranslation();
    const match = findAdminNav(adminSection.url(section));
    const title =
        explicitTitle ?? match?.link?.title ?? match?.item.title ?? section;
    const group = match?.link ? match.item.title : null;

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            ...(group
                ? [{ title: group, href: adminSection.url(section) }]
                : []),
            { title, href: adminSection.url(section) },
        ],
    });

    return (
        <>
            <Head title={group ? `${t(title)} · ${t(group)}` : t(title)} />
            <div className="flex flex-1 items-start p-4 md:p-6">
                <Card className="w-full">
                    <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
                        <span className="rounded-full bg-muted p-4">
                            <Construction
                                className="size-8 text-amber-600 dark:text-amber-400"
                                aria-hidden
                            />
                        </span>
                        <h1 className="text-xl font-semibold">
                            {group ? `${t(group)}: ${t(title)}` : t(title)}
                        </h1>
                        <p className="max-w-md text-muted-foreground">
                            {t(
                                'This section is being built. It will appear here as soon as it is ready.',
                            )}
                        </p>
                        <Button variant="outline" asChild>
                            <Link href={dashboard()}>
                                {t('Back to dashboard')}
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
