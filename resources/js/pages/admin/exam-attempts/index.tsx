import { Head, Link, router } from '@inertiajs/react';
import { PenLine, Search } from 'lucide-react';
import { useState } from 'react';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import type { Paginator } from '@/components/admin/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import attemptRoutes from '@/routes/admin/exam-attempts';

type AttemptRow = {
    id: number;
    score: string | null;
    total_marks: string;
    needs_review: boolean;
    passed: boolean | null;
    submitted_at: string;
    user: { name: string; email: string };
    exam: { title: string };
};

type Filters = {
    search?: string;
    review?: boolean | string;
    per_page?: number;
};

/**
 * Exams → Results: submitted attempts, with the ones waiting for short answers to be marked.
 */
export default function ExamResults({
    attempts,
    filters,
    reviewCount,
}: {
    attempts: Paginator & { data: AttemptRow[] };
    filters: Filters;
    reviewCount: number;
}) {
    const { t, intlLocale } = useTranslation();
    const [search, setSearch] = useState(filters.search ?? '');
    const reviewOnly = filters.review === true || filters.review === '1';
    const dateTime = new Intl.DateTimeFormat(intlLocale, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

    const applyFilters = (changes: Partial<Filters>) =>
        router.get(
            attemptRoutes.index.url(),
            Object.fromEntries(
                Object.entries({
                    search: filters.search,
                    review: reviewOnly ? 1 : undefined,
                    ...changes,
                }).filter(
                    ([, value]) =>
                        value !== undefined && value !== '' && value !== false,
                ),
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );

    return (
        <>
            <Head title={t('Exam results')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t('Exam results')}
                </h1>
                <Card className="gap-0 py-0">
                    <CardHeader className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            value={reviewOnly ? 'review' : 'all'}
                            onValueChange={(value) =>
                                value &&
                                applyFilters({ review: value === 'review' })
                            }
                        >
                            <ToggleGroupItem value="all">
                                {t('All')}
                            </ToggleGroupItem>
                            <ToggleGroupItem value="review">
                                {t('To mark (:count)', {
                                    count: String(reviewCount),
                                })}
                            </ToggleGroupItem>
                        </ToggleGroup>
                        <form
                            role="search"
                            className="relative w-full md:w-64"
                            onSubmit={(event) => {
                                event.preventDefault();
                                applyFilters({ search });
                            }}
                        >
                            <Search
                                className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                                aria-hidden
                            />
                            <Input
                                type="search"
                                placeholder={t('Search')}
                                aria-label={t('Search results')}
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="ps-9"
                            />
                        </form>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full border-t text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-6 py-3 text-start font-medium">
                                        {t('Student')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        {t('Exam')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        {t('Score')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        {t('Result')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        {t('Submitted at')}
                                    </th>
                                    <th className="px-6 py-3 text-end font-medium">
                                        {t('Action')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {attempts.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-10 text-center"
                                        >
                                            {t('No results found')}
                                        </td>
                                    </tr>
                                )}
                                {attempts.data.map((attempt) => (
                                    <tr
                                        key={attempt.id}
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="px-6 py-3">
                                            <p className="font-medium">
                                                {attempt.user.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {attempt.user.email}
                                            </p>
                                        </td>
                                        <td className="max-w-64 px-3 py-3">
                                            {attempt.exam.title}
                                        </td>
                                        <td className="px-3 py-3 tabular-nums">
                                            {Number(attempt.score ?? 0)} /{' '}
                                            {Number(attempt.total_marks)}
                                        </td>
                                        <td className="px-3 py-3">
                                            <Badge
                                                variant={
                                                    attempt.needs_review
                                                        ? 'secondary'
                                                        : attempt.passed
                                                          ? 'default'
                                                          : 'destructive'
                                                }
                                            >
                                                {attempt.needs_review
                                                    ? t('To mark')
                                                    : attempt.passed
                                                      ? t('Passed')
                                                      : t('Failed')}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            {dateTime.format(
                                                new Date(attempt.submitted_at),
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-end">
                                            <Button
                                                size="sm"
                                                variant={
                                                    attempt.needs_review
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                asChild
                                            >
                                                <Link
                                                    href={attemptRoutes.show(
                                                        attempt.id,
                                                    )}
                                                >
                                                    <PenLine />
                                                    {attempt.needs_review
                                                        ? t('Mark')
                                                        : t('Written answers')}
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <DataTablePagination paginator={attempts} />
                </Card>
            </div>
        </>
    );
}

ExamResults.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Exam results', href: attemptRoutes.index() },
    ],
};
