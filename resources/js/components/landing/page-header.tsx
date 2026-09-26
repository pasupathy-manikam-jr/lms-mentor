import { Link } from '@inertiajs/react';
import { Fragment } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useTranslation } from '@/hooks/use-translation';
import { home } from '@/routes';

/**
 * Title banner for simple site pages (About Us, Our Team, Careers): the page title over a Home › … › title breadcrumb.
 */
export function PageHeader({
    title,
    parents = [],
}: {
    title: string;
    parents?: { label: string; href: string }[];
}) {
    const { t } = useTranslation();

    return (
        <section className="relative overflow-hidden bg-amber-50/60 py-20 dark:bg-amber-950/20">
            <div
                className="pointer-events-none absolute top-1/2 -right-40 size-[450px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.45)_0%,transparent_70%)] opacity-40"
                aria-hidden
            />
            <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 text-center">
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                    {title}
                </h1>
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={home()}>{t('Home')}</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        {parents.map((parent) => (
                            <Fragment key={parent.href}>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href={parent.href}>
                                            {parent.label}
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                            </Fragment>
                        ))}
                        <BreadcrumbItem>
                            <BreadcrumbPage>{title}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
        </section>
    );
}
