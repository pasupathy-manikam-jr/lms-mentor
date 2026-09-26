import { Head, router, setLayoutProps, useForm } from '@inertiajs/react';
import { Check, Search, X } from 'lucide-react';
import { useState } from 'react';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import type { Paginator } from '@/components/admin/data-table-pagination';
import { Field } from '@/components/admin/course-form';
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
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import payoutRoutes from '@/routes/admin/billing/payouts';

type PayoutRow = {
    id: number;
    amount: string;
    status: 'pending' | 'approved' | 'rejected';
    payout_method: string | null;
    note: string | null;
    processed_at: string | null;
    created_at: string;
    instructor: { id: number; name: string; title: string } | null;
};

type Filters = { search?: string; per_page?: number };

/**
 * Billings → Payout Request and Payout History, following the Mentor demo.
 */
export default function Payouts({
    view,
    payouts,
    filters,
}: {
    view: 'requests' | 'history';
    payouts: Paginator & { data: PayoutRow[] };
    filters: Filters;
}) {
    const { t, intlLocale } = useTranslation();
    const [search, setSearch] = useState(filters.search ?? '');
    const [paying, setPaying] = useState<PayoutRow | null>(null);
    const [rejecting, setRejecting] = useState<PayoutRow | null>(null);
    const isRequests = view === 'requests';
    const title = isRequests ? 'Payout request' : 'Payout history';
    const listUrl = isRequests
        ? payoutRoutes.requests.url()
        : payoutRoutes.history.url();
    const money = new Intl.NumberFormat(intlLocale, {
        style: 'currency',
        currency: 'USD',
        currencyDisplay: 'narrowSymbol',
    });
    const dateTime = new Intl.DateTimeFormat(intlLocale, {
        dateStyle: 'medium',
    });

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            {
                title,
                href: isRequests
                    ? payoutRoutes.requests()
                    : payoutRoutes.history(),
            },
        ],
    });

    const applyFilters = (changes: Partial<Filters>) =>
        router.get(
            listUrl,
            Object.fromEntries(
                Object.entries({ ...filters, ...changes }).filter(
                    ([, value]) => value !== undefined && value !== '',
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
                        <CardTitle className="text-lg">{t(title)}</CardTitle>
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
                                        {t('Payout amount')}
                                    </th>
                                    {!isRequests && (
                                        <th className="px-3 py-3 text-start font-medium">
                                            {t('Payout method')}
                                        </th>
                                    )}
                                    <th className="px-3 py-3 text-start font-medium">
                                        {t('Status')}
                                    </th>
                                    <th className="px-6 py-3 text-end font-medium">
                                        {isRequests
                                            ? t('Action')
                                            : t('Payout date')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {payouts.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={isRequests ? 4 : 5}
                                            className="px-6 py-10 text-center"
                                        >
                                            {t('No results found')}
                                        </td>
                                    </tr>
                                )}
                                {payouts.data.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="px-6 py-3">
                                            <p className="font-medium">
                                                {row.instructor?.name ?? '—'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {row.instructor?.title}
                                            </p>
                                        </td>
                                        <td className="px-3 py-3 font-medium tabular-nums">
                                            {money.format(Number(row.amount))}
                                        </td>
                                        {!isRequests && (
                                            <td className="px-3 py-3">
                                                {row.payout_method ?? '—'}
                                            </td>
                                        )}
                                        <td className="px-3 py-3">
                                            <Badge
                                                variant={
                                                    row.status === 'approved'
                                                        ? 'default'
                                                        : row.status ===
                                                            'rejected'
                                                          ? 'destructive'
                                                          : 'secondary'
                                                }
                                                title={row.note ?? undefined}
                                            >
                                                {row.status === 'approved'
                                                    ? t('Paid')
                                                    : row.status === 'rejected'
                                                      ? t('Rejected')
                                                      : t('Pending')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-3 text-end">
                                            {isRequests ? (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            setPaying(row)
                                                        }
                                                    >
                                                        <Check />
                                                        {t('Mark as paid')}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setRejecting(row)
                                                        }
                                                    >
                                                        <X />
                                                        {t('Reject')}
                                                    </Button>
                                                </div>
                                            ) : row.processed_at ? (
                                                dateTime.format(
                                                    new Date(row.processed_at),
                                                )
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <DataTablePagination paginator={payouts} />
                </Card>
            </div>

            {paying && (
                <ProcessDialog
                    row={paying}
                    action="approve"
                    onClose={() => setPaying(null)}
                />
            )}
            {rejecting && (
                <ProcessDialog
                    row={rejecting}
                    action="reject"
                    onClose={() => setRejecting(null)}
                />
            )}
        </>
    );
}

function ProcessDialog({
    row,
    action,
    onClose,
}: {
    row: PayoutRow;
    action: 'approve' | 'reject';
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const form = useForm({ payout_method: '', note: '' });
    const isApprove = action === 'approve';

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(
                            (isApprove
                                ? payoutRoutes.approve
                                : payoutRoutes.reject
                            ).url(row.id),
                            { preserveScroll: true, onSuccess: onClose },
                        );
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {isApprove
                                ? t('Mark this payout as paid?')
                                : t('Reject this payout request?')}
                        </DialogTitle>
                        <DialogDescription>
                            {isApprove
                                ? t(
                                      'Pay :name outside the site first, then record how you paid.',
                                      { name: row.instructor?.name ?? '' },
                                  )
                                : t('You can add a reason for your records.')}
                        </DialogDescription>
                    </DialogHeader>
                    {isApprove && (
                        <Field
                            label={t('Payout method')}
                            htmlFor="payout_method"
                            required
                            error={form.errors.payout_method}
                        >
                            <Input
                                id="payout_method"
                                value={form.data.payout_method}
                                onChange={(event) =>
                                    form.setData(
                                        'payout_method',
                                        event.target.value,
                                    )
                                }
                                placeholder={t('e.g. Bank transfer')}
                                className="h-10 rounded-lg"
                            />
                        </Field>
                    )}
                    <Field
                        label={t('Note')}
                        htmlFor="note"
                        error={form.errors.note}
                    >
                        <Textarea
                            id="note"
                            rows={3}
                            value={form.data.note}
                            onChange={(event) =>
                                form.setData('note', event.target.value)
                            }
                            placeholder={
                                isApprove
                                    ? t('e.g. the transfer reference')
                                    : t('Reason (optional)')
                            }
                        />
                    </Field>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                {t('Cancel')}
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            variant={isApprove ? 'default' : 'destructive'}
                            disabled={form.processing}
                        >
                            {form.processing && <Spinner />}
                            {isApprove ? t('Mark as paid') : t('Reject')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
