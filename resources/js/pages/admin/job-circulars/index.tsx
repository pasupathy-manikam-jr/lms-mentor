import { Head, Link, router } from '@inertiajs/react';
import {
    EllipsisVertical,
    ExternalLink,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import type { Paginator } from '@/components/admin/data-table-pagination';
import { JobMeta } from '@/components/landing/job-meta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import { create, destroy, edit, index } from '@/routes/admin/job-circulars';
import { show as careerShow } from '@/routes/careers';
import type { JobOpening } from '@/types';

export type JobStatus = 'draft' | 'active' | 'closed';

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
    draft: 'Draft',
    active: 'Active',
    closed: 'Closed',
};

type JobRow = JobOpening & { status: JobStatus };

type Filters = { search?: string; per_page?: number };

/** Today as Y-m-d in local time, to compare with deadlines. */
const today = () => new Date().toLocaleDateString('en-CA');

/**
 * All Jobs, following the Mentor demo: one card per circular with its status and details.
 */
export default function JobCirculars({
    jobs,
    filters,
}: {
    jobs: Paginator & { data: JobRow[] };
    filters: Filters;
}) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleting, setDeleting] = useState<JobRow | null>(null);

    const applyFilters = (changes: Partial<Filters>) =>
        router.get(
            index.url(),
            Object.fromEntries(
                Object.entries({ ...filters, ...changes }).filter(
                    ([, value]) => value !== undefined && value !== '',
                ),
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );

    return (
        <>
            <Head title={t('Job circulars')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t('Job circulars')}
                    </h1>
                    <Button asChild>
                        <Link href={create()}>
                            <Plus />
                            {t('Job circular')}
                        </Link>
                    </Button>
                </div>

                <Card className="gap-0 py-0">
                    <CardHeader className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                        <CardTitle className="text-lg">
                            {t('Job circulars list')}
                        </CardTitle>
                        <div className="flex items-center gap-3">
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
                                    aria-label={t('Search jobs')}
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="ps-9"
                                />
                            </form>
                            <Select
                                value={String(filters.per_page ?? 10)}
                                onValueChange={(value) =>
                                    applyFilters({ per_page: Number(value) })
                                }
                            >
                                <SelectTrigger
                                    className="w-20"
                                    aria-label={t('Rows per page')}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 50].map((size) => (
                                        <SelectItem
                                            key={size}
                                            value={String(size)}
                                        >
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <ul className="space-y-4 px-6 pb-6">
                        {jobs.data.length === 0 && (
                            <li className="py-10 text-center">
                                {t('No job circulars found.')}
                            </li>
                        )}
                        {jobs.data.map((job) => {
                            const isExpired =
                                job.status === 'active' &&
                                job.deadline < today();

                            return (
                                <li
                                    key={job.id}
                                    className="flex items-start justify-between gap-3 rounded-xl border p-4"
                                >
                                    <div className="min-w-0 space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Link
                                                href={edit(job.id)}
                                                className="text-lg font-semibold hover:underline"
                                            >
                                                {job.title}
                                            </Link>
                                            <Badge
                                                variant={
                                                    job.status === 'active' &&
                                                    !isExpired
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {isExpired
                                                    ? t('Deadline passed')
                                                    : t(
                                                          JOB_STATUS_LABEL[
                                                              job.status
                                                          ],
                                                      )}
                                            </Badge>
                                        </div>
                                        <JobMeta job={job} />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-full"
                                                aria-label={t(
                                                    'Actions for :name',
                                                    { name: job.title },
                                                )}
                                            >
                                                <EllipsisVertical />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {job.status === 'active' &&
                                                !isExpired && (
                                                    <DropdownMenuItem asChild>
                                                        <a
                                                            href={careerShow.url(
                                                                job.slug,
                                                            )}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >
                                                            <ExternalLink />
                                                            {t('View')}
                                                        </a>
                                                    </DropdownMenuItem>
                                                )}
                                            <DropdownMenuItem asChild>
                                                <Link href={edit(job.id)}>
                                                    <Pencil />
                                                    {t('Edit')}
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onSelect={() =>
                                                    setDeleting(job)
                                                }
                                            >
                                                <Trash2 />
                                                {t('Delete')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </li>
                            );
                        })}
                    </ul>

                    <DataTablePagination paginator={jobs} />
                </Card>
            </div>

            {deleting && (
                <Dialog
                    open
                    onOpenChange={(open) => !open && setDeleting(null)}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {t('Delete this job circular?')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('":name" will be deleted.', {
                                    name: deleting.title,
                                })}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">{t('Cancel')}</Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                onClick={() =>
                                    router.delete(destroy.url(deleting.id), {
                                        preserveScroll: true,
                                        onSuccess: () => setDeleting(null),
                                    })
                                }
                            >
                                {t('Delete')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

JobCirculars.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Job circulars', href: index() },
    ],
};
