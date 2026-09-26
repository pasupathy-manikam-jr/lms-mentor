import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import {
    Check,
    Download,
    EllipsisVertical,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import type { Paginator } from '@/components/admin/data-table-pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import {
    applications,
    create,
    destroy,
    edit,
    index,
    resume,
    status as instructorStatus,
} from '@/routes/admin/instructors';

export type InstructorStatus = 'pending' | 'approved' | 'rejected';

export const INSTRUCTOR_STATUS_LABEL: Record<InstructorStatus, string> = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
};

type InstructorRow = {
    id: number;
    name: string;
    title: string;
    status: InstructorStatus;
    avatar_url: string | null;
    resume_name: string | null;
    courses_count: number;
    user: { id: number; email: string } | null;
};

type Filters = { search?: string; per_page?: number };

/**
 * Manage Instructors and Applications, following the Mentor demo. Both are the same table; the
 * applications view adds the resume and Approve/Reject.
 */
export default function Instructors({
    view,
    status,
    instructors,
    filters,
}: {
    view: 'instructors' | 'applications';
    status?: 'pending' | 'rejected';
    instructors: Paginator & { data: InstructorRow[] };
    filters: Filters;
}) {
    const { t } = useTranslation();
    const getInitials = useInitials();
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleting, setDeleting] = useState<InstructorRow | null>(null);
    const isApplications = view === 'applications';
    const title = isApplications ? 'Instructor applications' : 'Instructors';
    const listUrl = isApplications ? applications.url() : index.url();

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Instructors', href: index() },
            ...(isApplications
                ? [{ title: 'Applications', href: applications() }]
                : []),
        ],
    });

    const applyFilters = (changes: Partial<Filters & { status: string }>) =>
        router.get(
            listUrl,
            Object.fromEntries(
                Object.entries({ ...filters, status, ...changes }).filter(
                    ([, value]) => value !== undefined && value !== '',
                ),
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );

    const setStatus = (row: InstructorRow, value: InstructorStatus) =>
        router.patch(
            instructorStatus.url(row.id),
            { status: value },
            { preserveScroll: true },
        );

    return (
        <>
            <Head title={t(title)} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t(title)}
                    </h1>
                    {!isApplications && (
                        <Button asChild>
                            <Link href={create()}>
                                <Plus />
                                {t('Add instructor')}
                            </Link>
                        </Button>
                    )}
                </div>

                <Card className="gap-0 py-0">
                    <CardHeader className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                        {isApplications ? (
                            <ToggleGroup
                                type="single"
                                variant="outline"
                                value={status}
                                onValueChange={(value) =>
                                    value && applyFilters({ status: value })
                                }
                                aria-label={t('Status')}
                            >
                                <ToggleGroupItem value="pending">
                                    {t('Pending')}
                                </ToggleGroupItem>
                                <ToggleGroupItem value="rejected">
                                    {t('Rejected')}
                                </ToggleGroupItem>
                            </ToggleGroup>
                        ) : (
                            <CardTitle className="text-lg">
                                {t('Instructor list')}
                            </CardTitle>
                        )}
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
                                    aria-label={t('Search instructors')}
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
                                    <th className="px-6 py-3 text-start font-medium">
                                        {t('Name')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        {isApplications
                                            ? t('Resume')
                                            : t('Number of courses')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        {t('Status')}
                                    </th>
                                    <th className="px-6 py-3 text-end font-medium">
                                        {t('Action')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {instructors.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-10 text-center"
                                        >
                                            {t('No results found')}
                                        </td>
                                    </tr>
                                )}
                                {instructors.data.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-10">
                                                    {row.avatar_url && (
                                                        <AvatarImage
                                                            src={row.avatar_url}
                                                            alt=""
                                                        />
                                                    )}
                                                    <AvatarFallback className="bg-amber-500 font-semibold text-white">
                                                        {getInitials(
                                                            row.name.replace(
                                                                /^(Dr|Prof)\.\s*/,
                                                                '',
                                                            ),
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="font-medium">
                                                        {row.name}
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {row.user?.email ??
                                                            row.title}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">
                                            {isApplications ? (
                                                row.resume_name ? (
                                                    <a
                                                        href={resume.url(
                                                            row.id,
                                                        )}
                                                        className="inline-flex items-center gap-1 hover:underline"
                                                    >
                                                        <Download className="size-4" />
                                                        {row.resume_name}
                                                    </a>
                                                ) : (
                                                    '—'
                                                )
                                            ) : (
                                                <span className="tabular-nums">
                                                    {row.courses_count}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <Badge
                                                variant={
                                                    row.status === 'approved'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {t(
                                                    INSTRUCTOR_STATUS_LABEL[
                                                        row.status
                                                    ],
                                                )}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-3 text-end">
                                            <div className="flex items-center justify-end gap-2">
                                                {isApplications &&
                                                    row.status ===
                                                        'pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() =>
                                                                    setStatus(
                                                                        row,
                                                                        'approved',
                                                                    )
                                                                }
                                                            >
                                                                <Check />
                                                                {t('Approve')}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setStatus(
                                                                        row,
                                                                        'rejected',
                                                                    )
                                                                }
                                                            >
                                                                <X />
                                                                {t('Reject')}
                                                            </Button>
                                                        </>
                                                    )}
                                                <RowActions
                                                    row={row}
                                                    onStatus={(value) =>
                                                        setStatus(row, value)
                                                    }
                                                    onDelete={() =>
                                                        setDeleting(row)
                                                    }
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <DataTablePagination paginator={instructors} />
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
                                {t('Delete this instructor?')}
                            </DialogTitle>
                            <DialogDescription>
                                {deleting.courses_count > 0
                                    ? t(
                                          'This instructor still has courses, exams or products. Reassign them first.',
                                      )
                                    : t(
                                          '":name" will be deleted. Their user account is kept.',
                                          { name: deleting.name },
                                      )}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">{t('Cancel')}</Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                disabled={deleting.courses_count > 0}
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

function RowActions({
    row,
    onStatus,
    onDelete,
}: {
    row: InstructorRow;
    onStatus: (status: InstructorStatus) => void;
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
                    aria-label={t('Actions for :name', { name: row.name })}
                >
                    <EllipsisVertical />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={edit(row.id)}>
                        <Pencil />
                        {t('Edit')}
                    </Link>
                </DropdownMenuItem>
                {row.resume_name && (
                    <DropdownMenuItem asChild>
                        <a href={resume.url(row.id)}>
                            <Download />
                            {t('Download resume')}
                        </a>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <RefreshCw className="size-4 text-muted-foreground" />
                        {t('Status')}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup
                            value={row.status}
                            onValueChange={(value) =>
                                onStatus(value as InstructorStatus)
                            }
                        >
                            {(
                                Object.keys(
                                    INSTRUCTOR_STATUS_LABEL,
                                ) as InstructorStatus[]
                            ).map((value) => (
                                <DropdownMenuRadioItem
                                    key={value}
                                    value={value}
                                >
                                    {t(INSTRUCTOR_STATUS_LABEL[value])}
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
