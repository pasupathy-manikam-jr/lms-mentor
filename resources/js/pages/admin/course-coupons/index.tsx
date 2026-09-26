import { Head, router, setLayoutProps, useForm } from '@inertiajs/react';
import {
    EllipsisVertical,
    Pencil,
    Plus,
    Search,
    Shuffle,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import type { Paginator } from '@/components/admin/data-table-pagination';
import InputError from '@/components/input-error';
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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import courseCoupons from '@/routes/admin/course-coupons';
import examCoupons from '@/routes/admin/exam-coupons';
import productCoupons from '@/routes/admin/product-coupons';

type Scope = 'course' | 'exam' | 'product';

/** Route helpers and labels for each kind of coupon. */
const SCOPES = {
    course: {
        routes: courseCoupons,
        title: 'Course coupons',
        column: 'Course',
        all: 'All courses',
        allGlobal: 'All courses (global coupon)',
        select: 'Select course',
    },
    exam: {
        routes: examCoupons,
        title: 'Exam coupons',
        column: 'Exam',
        all: 'All exams',
        allGlobal: 'All exams (global coupon)',
        select: 'Select exam',
    },
    product: {
        routes: productCoupons,
        title: 'Product coupons',
        column: 'Product',
        all: 'All products',
        allGlobal: 'All products (global coupon)',
        select: 'Select product',
    },
} as const;

type CouponStatus = 'active' | 'inactive' | 'scheduled' | 'expired';

type CouponRow = {
    id: number;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount: string;
    /** The course or exam it is limited to; null for a global coupon. */
    item: { id: number; title: string } | null;
    /** ISO 8601 in UTC; shown in the viewer's own time zone. */
    valid_from: string;
    valid_to: string;
    is_active: boolean;
    status: CouponStatus;
};

type Filters = { search?: string; per_page?: number };

const STATUS_VARIANT = {
    active: 'default',
    scheduled: 'secondary',
    inactive: 'outline',
    expired: 'outline',
} as const;

const STATUS_LABEL: Record<CouponStatus, string> = {
    active: 'Active',
    scheduled: 'Scheduled',
    inactive: 'Inactive',
    expired: 'Expired',
};

/** A date as the value of a datetime-local input, in the viewer's time zone. */
const toLocalInput = (iso: string) => {
    const date = new Date(iso);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

    return date.toISOString().slice(0, 16);
};

/** An easy-to-read random code, without look-alike characters. */
const randomCode = () =>
    Array.from(
        crypto.getRandomValues(new Uint32Array(8)),
        (n) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n % 32],
    ).join('');

/**
 * Course Coupons, following the Mentor demo: a Coupon List with search and page size, and a
 * Create/Edit Coupon dialog.
 */
export default function CourseCoupons({
    scope,
    coupons,
    filters,
    items,
}: {
    scope: Scope;
    coupons: Paginator & { data: CouponRow[] };
    filters: Filters;
    items: { id: number; title: string }[];
}) {
    const { t, intlLocale } = useTranslation();
    const { routes, ...labels } = SCOPES[scope];

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            {
                title: labels.title,
                href: routes.index(),
            },
        ],
    });
    const [search, setSearch] = useState(filters.search ?? '');
    const [editing, setEditing] = useState<CouponRow | 'new' | null>(null);
    const [deleting, setDeleting] = useState<CouponRow | null>(null);

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
        new Date(iso).toLocaleString(intlLocale, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });

    const formatDiscount = (coupon: CouponRow) =>
        coupon.discount_type === 'percentage'
            ? `${Number(coupon.discount)}%`
            : new Intl.NumberFormat(intlLocale, {
                  style: 'currency',
                  currency: 'USD',
                  currencyDisplay: 'narrowSymbol',
              }).format(Number(coupon.discount));

    return (
        <>
            <Head title={t('Coupons')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t('Coupons')}
                    </h1>
                    <Button onClick={() => setEditing('new')}>
                        <Plus />
                        {t('Add coupon')}
                    </Button>
                </div>

                <Card className="gap-0 py-0">
                    <CardHeader className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                        <CardTitle className="text-lg">
                            {t('Coupon list')}
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
                                    aria-label={t('Search coupons')}
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
                                    {[
                                        t('Coupon code'),
                                        t('Discount'),
                                        t(labels.column),
                                        t('Valid from'),
                                        t('Valid to'),
                                        t('Status'),
                                    ].map((heading) => (
                                        <th
                                            key={heading}
                                            className="px-6 py-3 text-start font-medium whitespace-nowrap"
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                    <th className="px-6 py-3 text-end font-medium">
                                        {t('Actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-10 text-center"
                                        >
                                            {t('No coupons found.')}
                                        </td>
                                    </tr>
                                )}
                                {coupons.data.map((coupon) => (
                                    <tr
                                        key={coupon.id}
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="px-6 py-3 font-mono font-medium">
                                            {coupon.code}
                                        </td>
                                        <td className="px-6 py-3 tabular-nums">
                                            {formatDiscount(coupon)}
                                        </td>
                                        <td className="max-w-64 px-6 py-3">
                                            {coupon.item?.title ?? (
                                                <span className="text-muted-foreground">
                                                    {t(labels.all)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            {formatDate(coupon.valid_from)}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            {formatDate(coupon.valid_to)}
                                        </td>
                                        <td className="px-6 py-3">
                                            <Badge
                                                variant={
                                                    STATUS_VARIANT[
                                                        coupon.status
                                                    ]
                                                }
                                            >
                                                {t(STATUS_LABEL[coupon.status])}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-3 text-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full"
                                                        aria-label={t(
                                                            'Actions for :name',
                                                            {
                                                                name: coupon.code,
                                                            },
                                                        )}
                                                    >
                                                        <EllipsisVertical />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            setEditing(coupon)
                                                        }
                                                    >
                                                        <Pencil />
                                                        {t('Edit')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onSelect={() =>
                                                            setDeleting(coupon)
                                                        }
                                                    >
                                                        <Trash2 />
                                                        {t('Delete')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <DataTablePagination paginator={coupons} />
                </Card>
            </div>

            {editing && (
                <CouponDialog
                    coupon={editing === 'new' ? undefined : editing}
                    scope={scope}
                    items={items}
                    onClose={() => setEditing(null)}
                />
            )}

            {deleting && (
                <Dialog
                    open
                    onOpenChange={(open) => !open && setDeleting(null)}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {t('Delete this coupon?')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('":name" will be deleted.', {
                                    name: deleting.code,
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
                                        routes.destroy.url(deleting.id),
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => setDeleting(null),
                                        },
                                    )
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

function CouponDialog({
    coupon,
    scope,
    items,
    onClose,
}: {
    coupon?: CouponRow;
    scope: Scope;
    items: { id: number; title: string }[];
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const { routes, ...labels } = SCOPES[scope];
    const form = useForm({
        code: coupon?.code ?? '',
        discount_type: coupon?.discount_type ?? 'percentage',
        discount: coupon ? String(Number(coupon.discount)) : '0',
        item_id: coupon?.item ? String(coupon.item.id) : 'all',
        valid_from: coupon ? toLocalInput(coupon.valid_from) : '',
        valid_to: coupon ? toLocalInput(coupon.valid_to) : '',
        is_active: coupon ? (coupon.is_active ? '1' : '0') : '1',
    });
    const { data, setData, errors } = form;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        // Send times with the browser's offset so the server can store them in UTC.
        form.transform((values) => ({
            ...values,
            item_id: values.item_id === 'all' ? null : values.item_id,
            valid_from: values.valid_from
                ? new Date(values.valid_from).toISOString()
                : '',
            valid_to: values.valid_to
                ? new Date(values.valid_to).toISOString()
                : '',
        }));
        const options = { preserveScroll: true, onSuccess: onClose };

        if (coupon) {
            form.put(routes.update.url(coupon.id), options);
        } else {
            form.post(routes.store.url(), options);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
                <DialogHeader className="mb-2">
                    <DialogTitle>
                        {coupon ? t('Edit coupon') : t('Create coupon')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <Field
                        label={`${t('Coupon code')} *`}
                        htmlFor="coupon-code"
                        error={errors.code}
                    >
                        <div className="flex gap-2">
                            <Input
                                id="coupon-code"
                                required
                                value={data.code}
                                onChange={(event) =>
                                    setData(
                                        'code',
                                        event.target.value.toUpperCase(),
                                    )
                                }
                                placeholder="SUMMER2026"
                                aria-invalid={!!errors.code}
                                className="h-10 font-mono"
                                autoFocus
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-10 shrink-0"
                                aria-label={t('Generate a random code')}
                                onClick={() => setData('code', randomCode())}
                            >
                                <Shuffle />
                            </Button>
                        </div>
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label={`${t('Discount type')} *`}
                            htmlFor="coupon-type"
                            error={errors.discount_type}
                        >
                            <Select
                                value={data.discount_type}
                                onValueChange={(value) =>
                                    setData(
                                        'discount_type',
                                        value as CouponRow['discount_type'],
                                    )
                                }
                            >
                                <SelectTrigger
                                    id="coupon-type"
                                    className="w-full data-[size=default]:h-10"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">
                                        {t('Percentage (%)')}
                                    </SelectItem>
                                    <SelectItem value="fixed">
                                        {t('Fixed amount ($)')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field
                            label={`${t('Discount value')} *`}
                            htmlFor="coupon-value"
                            error={errors.discount}
                        >
                            <Input
                                id="coupon-value"
                                type="number"
                                min="0"
                                step="0.01"
                                max={
                                    data.discount_type === 'percentage'
                                        ? 100
                                        : undefined
                                }
                                required
                                value={data.discount}
                                onChange={(event) =>
                                    setData('discount', event.target.value)
                                }
                                aria-invalid={!!errors.discount}
                                className="h-10"
                            />
                        </Field>
                    </div>

                    <Field
                        label={t(labels.select)}
                        htmlFor="coupon-item"
                        error={errors.item_id}
                    >
                        <Select
                            value={data.item_id}
                            onValueChange={(value) => setData('item_id', value)}
                        >
                            <SelectTrigger
                                id="coupon-item"
                                className="w-full data-[size=default]:h-10"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    {t(labels.allGlobal)}
                                </SelectItem>
                                {items.map((item) => (
                                    <SelectItem
                                        key={item.id}
                                        value={String(item.id)}
                                    >
                                        {item.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label={`${t('Valid from')} *`}
                            htmlFor="coupon-from"
                            error={errors.valid_from}
                        >
                            <Input
                                id="coupon-from"
                                type="datetime-local"
                                required
                                value={data.valid_from}
                                onChange={(event) =>
                                    setData('valid_from', event.target.value)
                                }
                                aria-invalid={!!errors.valid_from}
                                className="h-10"
                            />
                        </Field>
                        <Field
                            label={`${t('Valid to')} *`}
                            htmlFor="coupon-to"
                            error={errors.valid_to}
                        >
                            <Input
                                id="coupon-to"
                                type="datetime-local"
                                required
                                value={data.valid_to}
                                onChange={(event) =>
                                    setData('valid_to', event.target.value)
                                }
                                aria-invalid={!!errors.valid_to}
                                className="h-10"
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label={t('Status')}
                            htmlFor="coupon-status"
                            error={errors.is_active}
                        >
                            <Select
                                value={data.is_active}
                                onValueChange={(value) =>
                                    setData('is_active', value)
                                }
                            >
                                <SelectTrigger
                                    id="coupon-status"
                                    className="w-full data-[size=default]:h-10"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">
                                        {t('Active')}
                                    </SelectItem>
                                    <SelectItem value="0">
                                        {t('Inactive')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>

                    <DialogFooter className="pt-2">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                {t('Cancel')}
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner />}
                            {coupon ? t('Save changes') : t('Create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    htmlFor,
    error,
    children,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}
