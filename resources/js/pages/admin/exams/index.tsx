import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpDown,
    ChevronsUpDown,
    EllipsisVertical,
    ExternalLink,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import type { Paginator } from '@/components/admin/data-table-pagination';
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
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
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
import {
    create,
    destroy,
    edit,
    index,
    status as examStatus,
} from '@/routes/admin/exams';
import { show as examShow } from '@/routes/exams';

export type ExamStatus = 'draft' | 'published' | 'archived';

type ExamRow = {
    id: number;
    title: string;
    slug: string;
    status: ExamStatus;
    level: 'beginner' | 'intermediate' | 'advanced';
    price: string;
    max_attempts: number;
    questions_count: number;
    enrollments_count: number;
    instructor: { id: number; name: string; title: string } | null;
    category: { id: number; name: string } | null;
};

type Filters = {
    search?: string;
    status?: ExamStatus;
    sort?: 'instructor' | 'questions' | 'enrollments';
    direction?: 'asc' | 'desc';
    per_page?: number;
};

export const EXAM_STATUS_LABEL: Record<ExamStatus, string> = {
    draft: 'Draft',
    published: 'Published',
    archived: 'Archived',
};

/**
 * Manage Exams, following the Mentor demo: an Exam List with search, instructor sort, a status filter,
 * and per-row actions.
 */
export default function ManageExams({
    exams,
    filters,
    statuses,
}: {
    exams: Paginator & { data: ExamRow[] };
    filters: Filters;
    statuses: ExamStatus[];
}) {
    const { t, intlLocale } = useTranslation();
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleting, setDeleting] = useState<ExamRow | null>(null);
    const money = new Intl.NumberFormat(intlLocale, {
        style: 'currency',
        currency: 'USD',
        currencyDisplay: 'narrowSymbol',
    });

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

    const toggleSort = (column: 'instructor' | 'questions' | 'enrollments') =>
        applyFilters({
            sort: column,
            direction:
                filters.sort === column && filters.direction !== 'desc'
                    ? 'desc'
                    : 'asc',
        });

    return (
        <>
            <Head title={t('Exams')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t('Exams')}
                    </h1>
                    <Button asChild>
                        <Link href={create()}>
                            <Plus />
                            {t('Create exam')}
                        </Link>
                    </Button>
                </div>

                <Card className="gap-0 py-0">
                    <CardHeader className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                        <CardTitle className="text-lg">
                            {t('Exam list')}
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
                                    aria-label={t('Search exams')}
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

                    <div className="overflow-x-auto">
                        <table className="w-full border-t text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-6 py-2 text-start font-medium">
                                        <SortButton
                                            label={t('Instructor')}
                                            active={
                                                filters.sort === 'instructor'
                                            }
                                            onClick={() =>
                                                toggleSort('instructor')
                                            }
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-start font-medium">
                                        {t('Exam title')}
                                    </th>
                                    <th className="px-3 py-2 text-center font-medium">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-muted-foreground"
                                                >
                                                    {filters.status
                                                        ? t(
                                                              EXAM_STATUS_LABEL[
                                                                  filters.status
                                                              ],
                                                          )
                                                        : t('Status')}
                                                    <ChevronsUpDown className="size-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuLabel>
                                                    {t('Filter by status')}
                                                </DropdownMenuLabel>
                                                <DropdownMenuRadioGroup
                                                    value={filters.status ?? ''}
                                                    onValueChange={(value) =>
                                                        applyFilters({
                                                            status:
                                                                (value as ExamStatus) ||
                                                                undefined,
                                                        })
                                                    }
                                                >
                                                    <DropdownMenuRadioItem value="">
                                                        {t('All statuses')}
                                                    </DropdownMenuRadioItem>
                                                    {statuses.map((value) => (
                                                        <DropdownMenuRadioItem
                                                            key={value}
                                                            value={value}
                                                        >
                                                            {t(
                                                                EXAM_STATUS_LABEL[
                                                                    value
                                                                ],
                                                            )}
                                                        </DropdownMenuRadioItem>
                                                    ))}
                                                </DropdownMenuRadioGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </th>
                                    <th className="px-3 py-2 text-center font-medium">
                                        {t('Level')}
                                    </th>
                                    <th className="px-3 py-2 text-center font-medium">
                                        <SortButton
                                            label={t('Questions')}
                                            active={
                                                filters.sort === 'questions'
                                            }
                                            onClick={() =>
                                                toggleSort('questions')
                                            }
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-center font-medium">
                                        <SortButton
                                            label={t('Enrollments')}
                                            active={
                                                filters.sort === 'enrollments'
                                            }
                                            onClick={() =>
                                                toggleSort('enrollments')
                                            }
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-center font-medium">
                                        {t('Price')}
                                    </th>
                                    <th className="px-3 py-2 text-center font-medium">
                                        {t('Attempts')}
                                    </th>
                                    <th className="px-6 py-2 text-end font-medium">
                                        {t('Actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {exams.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-6 py-10 text-center"
                                        >
                                            {t('No exams found.')}
                                        </td>
                                    </tr>
                                )}
                                {exams.data.map((exam) => (
                                    <tr
                                        key={exam.id}
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="px-6 py-3">
                                            <p className="font-medium">
                                                {exam.instructor?.name ?? '—'}
                                            </p>
                                            {exam.instructor && (
                                                <p className="text-xs text-muted-foreground">
                                                    {exam.instructor.title}
                                                </p>
                                            )}
                                        </td>
                                        <td className="max-w-72 px-3 py-3">
                                            <Link
                                                href={edit(exam.id)}
                                                className="font-medium hover:underline"
                                            >
                                                {exam.title}
                                            </Link>
                                            {exam.category && (
                                                <p className="text-xs text-muted-foreground">
                                                    {exam.category.name}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <Badge
                                                variant={
                                                    exam.status === 'published'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {t(
                                                    EXAM_STATUS_LABEL[
                                                        exam.status
                                                    ],
                                                )}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <Badge variant="outline">
                                                {t(
                                                    exam.level
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                        exam.level.slice(1),
                                                )}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-3 text-center tabular-nums">
                                            {exam.questions_count}
                                        </td>
                                        <td className="px-3 py-3 text-center tabular-nums">
                                            {exam.enrollments_count}
                                        </td>
                                        <td className="px-3 py-3 text-center font-medium tabular-nums">
                                            {Number(exam.price) === 0 ? (
                                                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                    {t('Free')}
                                                </Badge>
                                            ) : (
                                                money.format(Number(exam.price))
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-center whitespace-nowrap text-muted-foreground">
                                            {t(
                                                exam.max_attempts === 1
                                                    ? ':count attempt'
                                                    : ':count attempts',
                                                { count: exam.max_attempts },
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-end">
                                            <RowActions
                                                exam={exam}
                                                statuses={statuses}
                                                onDelete={() =>
                                                    setDeleting(exam)
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <DataTablePagination paginator={exams} />
                </Card>
            </div>

            {deleting && (
                <Dialog
                    open
                    onOpenChange={(open) => !open && setDeleting(null)}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('Delete this exam?')}</DialogTitle>
                            <DialogDescription>
                                {t(
                                    '":name" and all of its questions will be deleted.',
                                    { name: deleting.title },
                                )}
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

ManageExams.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Exams', href: index() },
    ],
};

function SortButton({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <Button
            variant="ghost"
            size="sm"
            className={active ? 'text-foreground' : 'text-muted-foreground'}
            onClick={onClick}
        >
            {label}
            <ArrowUpDown className="size-3.5" />
        </Button>
    );
}

function RowActions({
    exam,
    statuses,
    onDelete,
}: {
    exam: ExamRow;
    statuses: ExamStatus[];
    onDelete: () => void;
}) {
    const { t } = useTranslation();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label={t('Actions for :name', { name: exam.title })}
                >
                    <EllipsisVertical />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <a
                        href={examShow.url(exam.slug)}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <ExternalLink />
                        {t('View')}
                    </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={edit(exam.id)}>
                        <Pencil />
                        {t('Edit')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <RefreshCw className="size-4 text-muted-foreground" />
                        {t('Change status')}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup
                            value={exam.status}
                            onValueChange={(value) =>
                                router.patch(
                                    examStatus.url(exam.id),
                                    { status: value },
                                    { preserveScroll: true },
                                )
                            }
                        >
                            {statuses.map((value) => (
                                <DropdownMenuRadioItem
                                    key={value}
                                    value={value}
                                >
                                    {t(EXAM_STATUS_LABEL[value])}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                    <Trash2 />
                    {t('Delete')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
