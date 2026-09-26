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
import { create, destroy, edit, index, status } from '@/routes/admin/courses';
import { show as courseShow } from '@/routes/courses';

type CourseStatus = 'approved' | 'upcoming' | 'pending' | 'private' | 'draft';

type CourseRow = {
    id: number;
    title: string;
    slug: string;
    status: CourseStatus;
    price: string;
    assignments_count: number;
    enrollments_count: number;
    instructor: { id: number; name: string; title: string } | null;
    category: { id: number; name: string } | null;
    subcategory: { id: number; name: string } | null;
};

type Filters = {
    search?: string;
    status?: CourseStatus;
    sort?: 'name' | 'price';
    direction?: 'asc' | 'desc';
    per_page?: number;
};

const statusLabel: Record<CourseStatus, string> = {
    approved: 'Approved',
    upcoming: 'Upcoming',
    pending: 'Pending',
    private: 'Private',
    draft: 'Draft',
};

export default function ManageCourses({
    courses,
    filters,
    statuses,
}: {
    courses: Paginator & { data: CourseRow[] };
    filters: Filters;
    statuses: CourseStatus[];
}) {
    const { t, intlLocale } = useTranslation();
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleting, setDeleting] = useState<CourseRow | null>(null);

    const money = new Intl.NumberFormat(intlLocale, {
        style: 'currency',
        currency: 'USD',
        currencyDisplay: 'narrowSymbol',
    });

    // Every change keeps the other filters and goes back to page 1.
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

    const toggleSort = (column: 'name' | 'price') =>
        applyFilters({
            sort: column,
            direction:
                filters.sort === column && filters.direction !== 'desc'
                    ? 'desc'
                    : 'asc',
        });

    return (
        <>
            <Head title={t('Courses')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t('Courses')}
                    </h1>
                    <Button asChild>
                        <Link href={create()}>
                            <Plus />
                            {t('Create course')}
                        </Link>
                    </Button>
                </div>

                <Card className="gap-0 py-0">
                    <CardHeader className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                        <CardTitle className="text-lg">
                            {t('Course list')}
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <form
                                role="search"
                                className="relative w-full md:w-64"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    applyFilters({ search });
                                }}
                            >
                                <Search
                                    className="absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground"
                                    aria-hidden
                                />
                                <Input
                                    type="search"
                                    placeholder={t('Search')}
                                    aria-label={t('Search courses')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
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
                                            label={t('Name')}
                                            active={filters.sort === 'name'}
                                            onClick={() => toggleSort('name')}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-start font-medium">
                                        {t('Course title')}
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
                                                              statusLabel[
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
                                                                (value as CourseStatus) ||
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
                                                                statusLabel[
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
                                        {t('Category')}
                                    </th>
                                    <th className="px-3 py-2 text-center font-medium whitespace-nowrap">
                                        {t('Subcategory')}
                                    </th>
                                    <th className="px-3 py-2 text-center font-medium">
                                        <SortButton
                                            label={t('Price')}
                                            active={filters.sort === 'price'}
                                            onClick={() => toggleSort('price')}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-center font-medium">
                                        {t('Assignments')}
                                    </th>
                                    <th className="px-6 py-2 text-end font-medium">
                                        {t('Action')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.data.length > 0 ? (
                                    courses.data.map((course) => (
                                        <tr
                                            key={course.id}
                                            className="border-b last:border-0 hover:bg-muted/50"
                                        >
                                            <td className="px-6 py-3">
                                                <p className="font-medium">
                                                    {course.instructor?.name ??
                                                        '—'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {course.instructor?.title}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <Link
                                                    href={edit.url(course.id)}
                                                    className="hover:underline"
                                                >
                                                    {course.title}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                {t(statusLabel[course.status])}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                {course.category?.name ?? '—'}
                                            </td>
                                            <td className="px-3 py-3 text-center text-muted-foreground">
                                                {course.subcategory?.name ??
                                                    '—'}
                                            </td>
                                            <td className="px-3 py-3 text-center tabular-nums">
                                                {Number(course.price) === 0
                                                    ? t('Free')
                                                    : money.format(
                                                          Number(course.price),
                                                      )}
                                            </td>
                                            <td className="px-3 py-3 text-center whitespace-nowrap text-muted-foreground tabular-nums">
                                                {course.assignments_count === 1
                                                    ? t(':count assignment', {
                                                          count: 1,
                                                      })
                                                    : t(':count assignments', {
                                                          count: course.assignments_count,
                                                      })}
                                            </td>
                                            <td className="px-6 py-3 text-end">
                                                <RowActions
                                                    course={course}
                                                    statuses={statuses}
                                                    onDelete={() =>
                                                        setDeleting(course)
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="h-24 text-center text-muted-foreground"
                                        >
                                            {t(
                                                'No courses match these filters.',
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <DataTablePagination paginator={courses} />
                </Card>
            </div>

            {deleting && (
                <DeleteCourseDialog
                    course={deleting}
                    onClose={() => setDeleting(null)}
                />
            )}
        </>
    );
}

ManageCourses.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Courses', href: index() },
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
    course,
    statuses,
    onDelete,
}: {
    course: CourseRow;
    statuses: CourseStatus[];
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
                    aria-label={t('Actions for :name', { name: course.title })}
                >
                    <EllipsisVertical />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={edit.url(course.id)}>
                        <Pencil />
                        {t('Edit')}
                    </Link>
                </DropdownMenuItem>
                {course.status === 'approved' && (
                    <DropdownMenuItem asChild>
                        <a
                            href={courseShow.url(course.slug)}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <ExternalLink />
                            {t('View on site')}
                        </a>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <RefreshCw className="size-4 text-muted-foreground" />
                        {t('Change status')}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup
                            value={course.status}
                            onValueChange={(value) =>
                                router.patch(
                                    status.url(course.id),
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
                                    {t(statusLabel[value])}
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

function DeleteCourseDialog({
    course,
    onClose,
}: {
    course: CourseRow;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const [processing, setProcessing] = useState(false);
    const hasStudents = course.enrollments_count > 0;

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {t('Delete :name?', { name: course.title })}
                    </DialogTitle>
                    <DialogDescription>
                        {hasStudents
                            ? t(
                                  'This course has enrolled students, so it cannot be deleted. Set it to private instead.',
                              )
                            : t(
                                  'The course and its lessons and assignments are deleted permanently.',
                              )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{t('Cancel')}</Button>
                    </DialogClose>
                    {!hasStudents && (
                        <Button
                            variant="destructive"
                            disabled={processing}
                            onClick={() =>
                                router.delete(destroy.url(course.id), {
                                    preserveScroll: true,
                                    onStart: () => setProcessing(true),
                                    onFinish: () => setProcessing(false),
                                    onSuccess: onClose,
                                })
                            }
                        >
                            {t('Delete')}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
