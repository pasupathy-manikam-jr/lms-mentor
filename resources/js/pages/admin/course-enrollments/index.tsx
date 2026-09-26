import { Head, router, setLayoutProps, useForm } from '@inertiajs/react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Combobox } from '@/components/admin/combobox';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import type { Paginator } from '@/components/admin/data-table-pagination';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import courseEnrollments from '@/routes/admin/course-enrollments';
import examEnrollments from '@/routes/admin/exam-enrollments';

type Scope = 'course' | 'exam';

/** Route helpers and labels for each kind of enrolment. */
const SCOPES = {
    course: {
        routes: courseEnrollments,
        breadcrumb: 'Course enrollments',
        column: 'Enrolled course',
        dialog: 'Add new course enrollment',
        select: 'Select course',
        search: 'Search courses',
        empty: 'No course found.',
        paidHint: "Paid records the course's current price as revenue.",
    },
    exam: {
        routes: examEnrollments,
        breadcrumb: 'Exam enrollments',
        column: 'Enrolled exam',
        dialog: 'Add new exam enrollment',
        select: 'Select exam',
        search: 'Search exams',
        empty: 'No exam found.',
        paidHint: "Paid records the exam's current price as revenue.",
    },
} as const;

type EnrollmentRow = {
    id: number;
    user: { id: number; name: string; email: string };
    /** The course or exam. */
    item: { id: number; title: string; slug: string };
    price_paid: string;
    /** ISO 8601; expires_at is null for lifetime access. */
    enrolled_at: string;
    expires_at: string | null;
};

type Filters = { search?: string; per_page?: number };

/**
 * Course Enrollments, following the Mentor demo: a numbered list of enrolments with the learner, the
 * course or exam, dates and a delete action, and an Add Enrollment dialog. Serves both kinds.
 */
export default function CourseEnrollments({
    scope,
    enrollments,
    filters,
    users,
    items,
    canManage,
}: {
    scope: Scope;
    enrollments: Paginator & { data: EnrollmentRow[] };
    filters: Filters;
    /** False for instructors, who only see enrolments in their own courses and exams. */
    canManage: boolean;
    users: { id: number; name: string; email: string }[];
    items: { id: number; title: string; price: string }[];
}) {
    const { t, intlLocale } = useTranslation();
    const { routes, ...labels } = SCOPES[scope];

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: labels.breadcrumb, href: routes.index() },
        ],
    });
    const getInitials = useInitials();
    const [search, setSearch] = useState(filters.search ?? '');
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState<EnrollmentRow | null>(null);

    const applyFilters = (changes: Partial<Filters>) =>
        router.get(
            routes.index.url(),
            Object.fromEntries(
                Object.entries({ ...filters, ...changes }).filter(
                    ([, value]) => value !== undefined && value !== '',
                ),
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString(intlLocale, { dateStyle: 'long' });

    return (
        <>
            <Head title={t('Enrollments')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t('Enrollments')}
                    </h1>
                    {canManage && (
                        <Button onClick={() => setAdding(true)}>
                            <Plus />
                            {t('Add enrollment')}
                        </Button>
                    )}
                </div>

                <Card className="gap-0 py-0">
                    <CardHeader className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                        <CardTitle className="text-lg">
                            {t('Enrollment list')}
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
                                    aria-label={t('Search enrollments')}
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
                                        #
                                    </th>
                                    {[
                                        t('Name'),
                                        t(labels.column),
                                        t('Enrolled date'),
                                        t('Expiry date'),
                                    ].map((heading) => (
                                        <th
                                            key={heading}
                                            className="px-3 py-3 text-start font-medium whitespace-nowrap"
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                    <th className="px-6 py-3 text-end font-medium">
                                        {t('Action')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-10 text-center"
                                        >
                                            {t('No enrollments found.')}
                                        </td>
                                    </tr>
                                )}
                                {enrollments.data.map((enrollment, i) => {
                                    const expired =
                                        !!enrollment.expires_at &&
                                        new Date(enrollment.expires_at) <
                                            new Date();

                                    return (
                                        <tr
                                            key={enrollment.id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-6 py-3 text-muted-foreground tabular-nums">
                                                {(enrollments.from ?? 1) + i}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-10">
                                                        <AvatarFallback>
                                                            {getInitials(
                                                                enrollment.user
                                                                    .name,
                                                            )}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="font-medium">
                                                            {
                                                                enrollment.user
                                                                    .name
                                                            }
                                                        </p>
                                                        <p className="truncate text-muted-foreground">
                                                            {
                                                                enrollment.user
                                                                    .email
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="max-w-80 px-3 py-3">
                                                {enrollment.item.title}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap">
                                                {formatDate(
                                                    enrollment.enrolled_at,
                                                )}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap">
                                                {enrollment.expires_at ? (
                                                    <Badge
                                                        variant={
                                                            expired
                                                                ? 'destructive'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {expired
                                                            ? t(
                                                                  'Expired :date',
                                                                  {
                                                                      date: formatDate(
                                                                          enrollment.expires_at,
                                                                      ),
                                                                  },
                                                              )
                                                            : formatDate(
                                                                  enrollment.expires_at,
                                                              )}
                                                    </Badge>
                                                ) : (
                                                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                        {t('Lifetime access')}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-end">
                                                {canManage && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        aria-label={t(
                                                            'Remove :name from :course',
                                                            {
                                                                name: enrollment
                                                                    .user.name,
                                                                course: enrollment
                                                                    .item.title,
                                                            },
                                                        )}
                                                        onClick={() =>
                                                            setRemoving(
                                                                enrollment,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <DataTablePagination paginator={enrollments} />
                </Card>
            </div>

            {adding && (
                <AddEnrollmentDialog
                    users={users}
                    scope={scope}
                    items={items}
                    onClose={() => setAdding(false)}
                />
            )}

            {removing && (
                <Dialog
                    open
                    onOpenChange={(open) => !open && setRemoving(null)}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {t('Remove this enrollment?')}
                            </DialogTitle>
                            <DialogDescription>
                                {t(':name will lose access to ":course".', {
                                    name: removing.user.name,
                                    course: removing.item.title,
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
                                    router.delete(
                                        routes.destroy.url(removing.id),
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => setRemoving(null),
                                        },
                                    )
                                }
                            >
                                {t('Remove')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

function AddEnrollmentDialog({
    scope,
    users,
    items,
    onClose,
}: {
    scope: Scope;
    users: { id: number; name: string; email: string }[];
    items: { id: number; title: string; price: string }[];
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const { routes, ...labels } = SCOPES[scope];
    const form = useForm({
        user_id: '',
        item_id: '',
        enrollment_type: 'free',
    });
    const { data, setData, errors } = form;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(routes.store.url(), {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="mb-2">
                    <DialogTitle>{t(labels.dialog)}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="enroll-user">{t('Select user')}</Label>
                        <Combobox
                            id="enroll-user"
                            value={data.user_id}
                            options={users.map((user) => ({
                                value: String(user.id),
                                label: user.name,
                                hint: user.email,
                            }))}
                            onChange={(value) => setData('user_id', value)}
                            placeholder={t('Select')}
                            searchPlaceholder={t('Search users')}
                            emptyText={t('No user found.')}
                            invalid={!!errors.user_id}
                        />
                        <InputError message={errors.user_id} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="enroll-item">{t(labels.select)}</Label>
                        <Combobox
                            id="enroll-item"
                            value={data.item_id}
                            options={items.map((item) => ({
                                value: String(item.id),
                                label: item.title,
                            }))}
                            onChange={(value) => setData('item_id', value)}
                            placeholder={t(labels.select)}
                            searchPlaceholder={t(labels.search)}
                            emptyText={t(labels.empty)}
                            invalid={!!errors.item_id}
                        />
                        <InputError message={errors.item_id} />
                    </div>
                    <fieldset className="space-y-2">
                        <legend className="mb-2 text-sm font-medium">
                            {t('Enrollment type')}
                        </legend>
                        <div className="flex gap-6">
                            {(
                                [
                                    ['free', t('Free')],
                                    ['paid', t('Paid')],
                                ] as const
                            ).map(([value, label]) => (
                                <label
                                    key={value}
                                    className="flex cursor-pointer items-center gap-2 text-sm font-medium"
                                >
                                    <input
                                        type="radio"
                                        name="enrollment_type"
                                        checked={data.enrollment_type === value}
                                        onChange={() =>
                                            setData('enrollment_type', value)
                                        }
                                        className="size-4 accent-primary"
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t(labels.paidHint)}
                        </p>
                        <InputError message={errors.enrollment_type} />
                    </fieldset>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner />}
                            {t('Submit')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
