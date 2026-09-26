import { Head, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import type { Paginator } from '@/components/admin/data-table-pagination';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
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
import { sales } from '@/routes/admin/products';

type OrderRow = {
    id: number;
    user: { id: number; name: string; email: string };
    product: { id: number; title: string };
    subtotal: string;
    discount: string;
    tax: string;
    total: string;
    ordered_at: string;
};

type Filters = { search?: string; per_page?: number };

/**
 * Product Sales, following the Mentor demo: every order with its subtotal, discount, tax and total.
 */
export default function ProductSales({
    orders,
    filters,
}: {
    orders: Paginator & { data: OrderRow[] };
    filters: Filters;
}) {
    const { t, intlLocale } = useTranslation();
    const [search, setSearch] = useState(filters.search ?? '');
    const money = (value: string) =>
        new Intl.NumberFormat(intlLocale, {
            style: 'currency',
            currency: 'USD',
            currencyDisplay: 'narrowSymbol',
        }).format(Number(value));

    const applyFilters = (changes: Partial<Filters>) =>
        router.get(
            sales.url(),
            Object.fromEntries(
                Object.entries({ ...filters, ...changes }).filter(
                    ([, value]) => value !== undefined && value !== '',
                ),
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );

    return (
        <>
            <Head title={t('Sales')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t('Sales')}
                </h1>
                <Card className="gap-0 py-0">
                    <CardHeader className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                        <CardTitle className="text-lg">{t('Sales')}</CardTitle>
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
                                    aria-label={t('Search sales')}
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
                                        t('Customer'),
                                        t('Product'),
                                        t('Subtotal'),
                                        t('Discount'),
                                        t('Tax'),
                                        t('Total'),
                                        t('Date'),
                                    ].map((heading, i) => (
                                        <th
                                            key={heading}
                                            className={
                                                i > 1 && i < 6
                                                    ? 'px-4 py-3 text-end font-medium'
                                                    : 'px-4 py-3 text-start font-medium first:ps-6 last:pe-6'
                                            }
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {orders.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-10 text-center"
                                        >
                                            {t('No sales yet.')}
                                        </td>
                                    </tr>
                                )}
                                {orders.data.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="px-4 py-3 ps-6">
                                            <p className="font-medium">
                                                {order.user.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {order.user.email}
                                            </p>
                                        </td>
                                        <td className="max-w-72 px-4 py-3">
                                            {order.product.title}
                                        </td>
                                        <td className="px-4 py-3 text-end tabular-nums">
                                            {money(order.subtotal)}
                                        </td>
                                        <td className="px-4 py-3 text-end text-muted-foreground tabular-nums">
                                            {Number(order.discount) > 0
                                                ? `−${money(order.discount)}`
                                                : money(order.discount)}
                                        </td>
                                        <td className="px-4 py-3 text-end text-muted-foreground tabular-nums">
                                            {money(order.tax)}
                                        </td>
                                        <td className="px-4 py-3 text-end font-medium tabular-nums">
                                            {money(order.total)}
                                        </td>
                                        <td className="px-4 py-3 pe-6 whitespace-nowrap">
                                            {new Date(
                                                order.ordered_at,
                                            ).toLocaleDateString(intlLocale, {
                                                dateStyle: 'medium',
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <DataTablePagination paginator={orders} />
                </Card>
            </div>
        </>
    );
}

ProductSales.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Product sales', href: sales() },
    ],
};
