import { Head, Link, useForm } from '@inertiajs/react';
import { Send } from 'lucide-react';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import type { Paginator } from '@/components/admin/data-table-pagination';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import payouts from '@/routes/instructor/payouts';

type PayoutRow = {
    id: number;
    amount: string;
    status: 'pending' | 'approved' | 'rejected';
    payout_method: string | null;
    note: string | null;
    processed_at: string | null;
    created_at: string;
};

/**
 * Billings → Withdraw for instructors: earnings, a withdrawal request, and past requests.
 */
export default function InstructorPayouts({
    balance,
    payouts: list,
    payoutDetails,
}: {
    balance: {
        earned: number;
        withdrawn: number;
        pending: number;
        available: number;
    };
    payouts: Paginator & { data: PayoutRow[] };
    payoutDetails: string | null;
}) {
    const { t, intlLocale } = useTranslation();
    const form = useForm({ amount: '' });
    const money = new Intl.NumberFormat(intlLocale, {
        style: 'currency',
        currency: 'USD',
    });
    const date = new Intl.DateTimeFormat(intlLocale, { dateStyle: 'medium' });
    const cards = [
        { label: t('Total earned'), value: balance.earned },
        { label: t('Withdrawn'), value: balance.withdrawn },
        { label: t('Pending'), value: balance.pending },
        { label: t('Available to withdraw'), value: balance.available },
    ];

    return (
        <>
            <Head title={t('Withdraw')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t('Withdraw')}
                </h1>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {cards.map((card) => (
                        <Card key={card.label} className="gap-1 p-5">
                            <p className="text-sm text-muted-foreground">
                                {card.label}
                            </p>
                            <p className="text-2xl font-semibold tabular-nums">
                                {money.format(card.value)}
                            </p>
                        </Card>
                    ))}
                </div>

                <Card className="max-w-xl">
                    <CardHeader>
                        <CardTitle>{t('Request a withdrawal')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {!payoutDetails && (
                            <p className="text-sm text-muted-foreground">
                                {t(
                                    'Add your payout details first so we know where to send the money.',
                                )}{' '}
                                <Link
                                    href={payouts.settings()}
                                    className="underline"
                                >
                                    {t('Payout settings')}
                                </Link>
                            </p>
                        )}
                        <form
                            className="flex flex-wrap items-end gap-3"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.post(payouts.store.url(), {
                                    preserveScroll: true,
                                    onSuccess: () => form.reset(),
                                });
                            }}
                        >
                            <div className="space-y-2">
                                <Label htmlFor="amount">
                                    {t('Amount (USD)')}
                                </Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    min={1}
                                    step="0.01"
                                    max={balance.available}
                                    value={form.data.amount}
                                    onChange={(event) =>
                                        form.setData(
                                            'amount',
                                            event.target.value,
                                        )
                                    }
                                    className="w-40"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={
                                    form.processing || balance.available < 1
                                }
                            >
                                {form.processing ? <Spinner /> : <Send />}
                                {t('Request withdrawal')}
                            </Button>
                        </form>
                        <InputError message={form.errors.amount} />
                    </CardContent>
                </Card>

                <Card className="gap-0 py-0">
                    <CardHeader className="py-6">
                        <CardTitle>{t('Payout history')}</CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full border-t text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-6 py-3 text-start font-medium">
                                        {t('Payout amount')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        {t('Status')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        {t('Payout method')}
                                    </th>
                                    <th className="px-6 py-3 text-end font-medium">
                                        {t('Date')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-10 text-center text-muted-foreground"
                                        >
                                            {t('No withdrawals yet.')}
                                        </td>
                                    </tr>
                                )}
                                {list.data.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="px-6 py-3 font-medium tabular-nums">
                                            {money.format(Number(row.amount))}
                                        </td>
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
                                        <td className="px-3 py-3">
                                            {row.payout_method ?? '—'}
                                        </td>
                                        <td className="px-6 py-3 text-end whitespace-nowrap">
                                            {date.format(
                                                new Date(
                                                    row.processed_at ??
                                                        row.created_at,
                                                ),
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <DataTablePagination paginator={list} />
                </Card>
            </div>
        </>
    );
}

InstructorPayouts.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Withdraw', href: payouts.index() },
    ],
};
