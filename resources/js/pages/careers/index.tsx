import { Link, router } from '@inertiajs/react';
import { Eye, Search } from 'lucide-react';
import { useState } from 'react';
import { CatalogPagination } from '@/components/landing/catalog-layout';
import { JobMeta } from '@/components/landing/job-meta';
import { PageHead } from '@/components/landing/page-head';
import { PageHeader } from '@/components/landing/page-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { SiteHeader } from '@/components/landing/site-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/use-translation';
import { usePageContent } from '@/lib/page-content';
import type { PageProps } from '@/lib/page-content';
import { index, show } from '@/routes/careers';
import type { JobOpening } from '@/types';

type CareersProps = {
    jobs: {
        data: JobOpening[];
        from: number | null;
        to: number | null;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    filters: { search?: string };
    page: PageProps;
};

export default function Careers({ jobs, filters, page }: CareersProps) {
    const { t } = useTranslation();
    const { text, seo } = usePageContent('careers', page);
    const [search, setSearch] = useState(filters.search ?? '');

    return (
        <>
            <PageHead seo={seo} />
            <div className="min-h-screen bg-background pt-18 text-foreground">
                <SiteHeader />

                <main>
                    <PageHeader title={text('header_title')} />

                    <section className="mx-auto max-w-5xl px-4 py-20">
                        <Card>
                            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <CardTitle className="text-lg">
                                    {text('list_title')}
                                </CardTitle>
                                <form
                                    role="search"
                                    className="relative w-full md:max-w-64"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        router.get(
                                            index.url(),
                                            search ? { search } : {},
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                                replace: true,
                                            },
                                        );
                                    }}
                                >
                                    <Search
                                        className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                        aria-hidden
                                    />
                                    <Input
                                        type="search"
                                        aria-label={t('Search jobs')}
                                        placeholder={t('Search jobs')}
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="pl-9"
                                    />
                                </form>
                            </CardHeader>
                            <CardContent>
                                {jobs.data.length > 0 ? (
                                    <ul className="space-y-4">
                                        {jobs.data.map((job) => (
                                            <li
                                                key={job.id}
                                                className="relative flex flex-col items-start justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 md:flex-row md:items-center"
                                            >
                                                <div className="space-y-3">
                                                    <h3 className="text-lg font-semibold">
                                                        {/* The stretched link makes the whole row clickable. */}
                                                        <Link
                                                            href={show.url(
                                                                job.slug,
                                                            )}
                                                            className="after:absolute after:inset-0 hover:underline"
                                                        >
                                                            {job.title}
                                                        </Link>
                                                    </h3>
                                                    <JobMeta job={job} />
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="pointer-events-none shrink-0"
                                                    tabIndex={-1}
                                                    aria-hidden
                                                >
                                                    <Eye />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                                        {filters.search
                                            ? t(
                                                  'No open positions match your search.',
                                              )
                                            : t(
                                                  'There are no open positions right now. Please check back soon.',
                                              )}
                                    </p>
                                )}

                                <CatalogPagination paginator={jobs} />
                            </CardContent>
                        </Card>
                    </section>
                </main>

                <SiteFooter />
            </div>
        </>
    );
}
