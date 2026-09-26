import { Head, router, setLayoutProps } from '@inertiajs/react';
import { Check, FileText, Search, X } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTranslation } from '@/hooks/use-translation';
import { GATEWAY_NAMES } from '@/pages/admin/billing/gateways';
import { dashboard } from '@/routes';
import payments from '@/routes/admin/billing/payments';

type PaymentStatus = 'pending' | 'paid' | 'rejected';

type PaymentRow = {
    id: number;
    amount: string;
    currency: string;
    method: string;
    transaction_id: string | null;
    status: PaymentStatus;
    paid_on: string | null;
    note: string | null;
    has_proof: boolean;
    user: { name: string; email: string };
    item: { type: 'course' | 'exam' | 'product'; title: string | null };
    created_at: string;
};

type Filters = { search?: string; per_page?: number };

const STATUS_LABEL: Record<PaymentStatus, string> = {
    pending: 'Pending',
    paid: 'Paid',
    rejected: 'Rejected',
};

const ITEM_LABEL = { course: 'Course', exam: 'Exam', product: 'Product' };

/**
 * Billings → Online Payments and Offline Payments, following the Mentor demo. Offline payments
 * wait for an admin to check the proof and approve or reject them.
 */
export default function Payments({
    type,
    status,
    payments: list,
    filters,
}: {
    type: 'online' | 'offline';
    status?: PaymentStatus | null;
    payments: Paginator & { data: PaymentRow[] };
    filters: Filters;
}) {
    const { t, intlLocale } = useTranslation();
    const [search, setSearch] = useState(filters.search ?? '');
    const [rejecting, setRejecting] = useState<PaymentRow | null>(null);
    const [note, setNote] = useState('');
    const isOffline = type === 'offline';
    const title = isOffline ? 'Offline payments' : 'Online payments';
    const listUrl = isOffline ? payments.offline.url() : payments.online.url();
    const dateTime = new Intl.DateTimeFormat(intlLocale, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
    const date = (value: string) =>
        new Date(`${value}T00:00:00`).toLocaleDateString(intlLocale, {
            dateStyle: 'medium',
        });
    const money = (row: PaymentRow) =>
        new Intl.NumberFormat(intlLocale, {
            style: 'currency',
            currency: row.currency,
        }).format(Number(row.amount));

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            {
                title,
                href: isOffline ? payments.offline() : payments.online(),
            },
        ],
    });

    const applyFilters = (changes: Partial<Filters & { status: string }>) =>
        router.get(
            listUrl,
            Object.fromEntries(
                Object.entries({ ...filters, status, ...changes }).filter(
                    ([, value]) =>
                        value !== undefined && value !== '' && value !== null,
                ),
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );

    return (
        <>
            <Head title={t(title)} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t(title)}
                </h1>

                <Card className="gap-0 py-0">
                    <CardHeader className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                        {isOffline ? (
                            <ToggleGroup
                                type="single"
                                variant="outline"
                                value={status ?? 'all'}
                                onValueChange={(value) =>
                                    value &&
                                    applyFilters({
                                        status: value === 'all' ? '' : value,
                                    })
                                }
                                aria-label={t('Status')}
                            >
                                {(
                                    [
                                        'all',
                                        'pending',
                                        'paid',
                                        'rejected',
                                    ] as const
                                ).map((value) => (
                                    <ToggleGroupItem key={value} value={value}>
                                        {value === 'all'
                                            ? t('All')
                                            : t(STATUS_LABEL[value])}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        ) : (
                            <CardTitle className="text-lg">
                                {t('Online payment report')}
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
                                    aria-label={t('Search payments')}
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
                                        {t('ID')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        {t('Customer')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        {t('Item')}
                                    </th>
                                    <th className="px-3 py-3 text-end font-medium">
                                        {t('Amount')}
                                    </th>
                                    {isOffline ? (
                                        <>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t('Payment date')}
                                            </th>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t('Status')}
                                            </th>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t('Submitted at')}
                                            </th>
                                            <th className="px-6 py-3 text-end font-medium">
                                                {t('Actions')}
                                            </th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t('Payment method')}
                                            </th>
                                            <th className="px-3 py-3 text-start font-medium">
                                                {t('Transaction ID')}
                                            </th>
                                            <th className="px-6 py-3 text-end font-medium">
                                                {t('Date')}
                                            </th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {list.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={isOffline ? 8 : 7}
                                            className="px-6 py-10 text-center"
                                        >
                                            {t('No results found')}
                                        </td>
                                    </tr>
                                )}
                                {list.data.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="px-6 py-3 font-medium tabular-nums">
                                            #{row.id}
                                        </td>
                                        <td className="px-3 py-3">
                                            <p className="font-medium">
                                                {row.user.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {row.user.email}
                                            </p>
                                        </td>
                                        <td className="max-w-64 px-3 py-3">
                                            <p className="truncate">
                                                {row.item.title ??
                                                    t('Deleted item')}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {t(ITEM_LABEL[row.item.type])}
                                            </p>
                                        </td>
                                        <td className="px-3 py-3 text-end font-medium tabular-nums">
                                            {money(row)}
                                        </td>
                                        {isOffline ? (
                                            <>
                                                <td className="px-3 py-3">
                                                    {row.paid_on
                                                        ? date(row.paid_on)
                                                        : '—'}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <Badge
                                                        variant={
                                                            row.status ===
                                                            'paid'
                                                                ? 'default'
                                                                : row.status ===
                                                                    'rejected'
                                                                  ? 'destructive'
                                                                  : 'secondary'
                                                        }
                                                        title={
                                                            row.note ??
                                                            undefined
                                                        }
                                                    >
                                                        {t(
                                                            STATUS_LABEL[
                                                                row.status
                                                            ],
                                                        )}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {dateTime.format(
                                                        new Date(
                                                            row.created_at,
                                                        ),
                                                    )}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {row.has_proof && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                asChild
                                                            >
                                                                <a
                                                                    href={payments.proof.url(
                                                                        row.id,
                                                                    )}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    <FileText />
                                                                    {t('Proof')}
                                                                </a>
                                                            </Button>
                                                        )}
                                                        {row.status ===
                                                            'pending' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        router.post(
                                                                            payments.approve.url(
                                                                                row.id,
                                                                            ),
                                                                            {},
                                                                            {
                                                                                preserveScroll: true,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <Check />
                                                                    {t(
                                                                        'Approve',
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setNote(
                                                                            '',
                                                                        );
                                                                        setRejecting(
                                                                            row,
                                                                        );
                                                                    }}
                                                                >
                                                                    <X />
                                                                    {t(
                                                                        'Reject',
                                                                    )}
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-3 py-3">
                                                    <Badge variant="outline">
                                                        {GATEWAY_NAMES[
                                                            row.method
                                                        ] ?? row.method}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-3 font-mono text-xs">
                                                    {row.transaction_id ?? '—'}
                                                </td>
                                                <td className="px-6 py-3 text-end whitespace-nowrap">
                                                    {dateTime.format(
                                                        new Date(
                                                            row.created_at,
                                                        ),
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <DataTablePagination paginator={list} />
                </Card>
            </div>

            {rejecting && (
                <Dialog
                    open
                    onOpenChange={(open) => !open && setRejecting(null)}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {t('Reject this payment?')}
                            </DialogTitle>
                            <DialogDescription>
                                {t(
                                    ':name will not get access. You can add a reason for your records.',
                                    { name: rejecting.user.name },
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                            placeholder={t('Reason (optional)')}
                            aria-label={t('Reason (optional)')}
                            rows={3}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">{t('Cancel')}</Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                onClick={() =>
                                    router.post(
                                        payments.reject.url(rejecting.id),
                                        { note },
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => setRejecting(null),
                                        },
                                    )
                                }
                            >
                                {t('Reject')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
