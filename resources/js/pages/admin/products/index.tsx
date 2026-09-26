import { Head, Link, router } from '@inertiajs/react';
import {
    EllipsisVertical,
    ExternalLink,
    Eye,
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
import { EXAM_STATUS_LABEL as STATUS_LABEL } from '@/pages/admin/exams/index';
import { dashboard } from '@/routes';
import {
    create,
    destroy,
    edit,
    index,
    sales,
    status as productStatus,
} from '@/routes/admin/products';
import { show as productShow } from '@/routes/store';

export type ProductStatus = 'draft' | 'published' | 'archived';

type ProductRow = {
    id: number;
    title: string;
    slug: string;
    status: ProductStatus;
    price: string;
    orders_count: number;
    instructor: { id: number; name: string; title: string } | null;
    category: { id: number; name: string } | null;
};

type Filters = { search?: string; status?: ProductStatus; per_page?: number };

/**
 * Manage Products, following the Mentor demo: Instructor, Title, Status, Category, Price, Orders and
 * Actions.
 */
export default function ManageProducts({
    products,
    filters,
    statuses,
}: {
    products: Paginator & { data: ProductRow[] };
    filters: Filters;
    statuses: ProductStatus[];
}) {
    const { t, intlLocale } = useTranslation();
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleting, setDeleting] = useState<ProductRow | null>(null);
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

    return (
        <>
            <Head title={t('Products')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t('Products')}
                    </h1>
                    <Button asChild>
                        <Link href={create()}>
                            <Plus />
                            {t('Create product')}
                        </Link>
                    </Button>
                </div>

                <Card className="gap-0 py-0">
                    <CardHeader className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                        <CardTitle className="text-lg">
                            {t('Products')}
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
                                    aria-label={t('Search products')}
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
                                        {t('Instructor')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        {t('Title')}
                                    </th>
                                    <th className="px-3 py-3 text-center font-medium">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-muted-foreground"
                                                >
                                                    {filters.status
                                                        ? t(
                                                              STATUS_LABEL[
                                                                  filters.status
                                                              ],
                                                          )
                                                        : t('Status')}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuRadioGroup
                                                    value={filters.status ?? ''}
                                                    onValueChange={(value) =>
                                                        applyFilters({
                                                            status:
                                                                (value as ProductStatus) ||
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
                                                                STATUS_LABEL[
                                                                    value
                                                                ],
                                                            )}
                                                        </DropdownMenuRadioItem>
                                                    ))}
                                                </DropdownMenuRadioGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </th>
                                    <th className="px-3 py-3 text-center font-medium">
                                        {t('Category')}
                                    </th>
                                    <th className="px-3 py-3 text-center font-medium">
                                        {t('Price')}
                                    </th>
                                    <th className="px-3 py-3 text-center font-medium">
                                        {t('Orders')}
                                    </th>
                                    <th className="px-6 py-3 text-end font-medium">
                                        {t('Actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-10 text-center"
                                        >
                                            {t('No products found.')}
                                        </td>
                                    </tr>
                                )}
                                {products.data.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="px-6 py-3">
                                            <p className="font-medium">
                                                {product.instructor?.name ??
                                                    '—'}
                                            </p>
                                            {product.instructor && (
                                                <p className="text-xs text-muted-foreground">
                                                    {product.instructor.title}
                                                </p>
                                            )}
                                        </td>
                                        <td className="max-w-80 px-3 py-3">
                                            <Link
                                                href={edit(product.id)}
                                                className="hover:underline"
                                            >
                                                {product.title}
                                            </Link>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <Badge
                                                variant={
                                                    product.status ===
                                                    'published'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {t(
                                                    STATUS_LABEL[
                                                        product.status
                                                    ],
                                                )}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            {product.category?.name ?? '—'}
                                        </td>
                                        <td className="px-3 py-3 text-center font-medium tabular-nums">
                                            {Number(product.price) === 0
                                                ? t('Free')
                                                : money.format(
                                                      Number(product.price),
                                                  )}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <Link
                                                href={sales({
                                                    query: {
                                                        search: product.title,
                                                    },
                                                })}
                                                className="inline-flex items-center gap-1 tabular-nums hover:underline"
                                                aria-label={t(
                                                    'Orders for :name',
                                                    { name: product.title },
                                                )}
                                            >
                                                <Eye className="size-4" />
                                                {product.orders_count}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-3 text-end">
                                            <RowActions
                                                product={product}
                                                statuses={statuses}
                                                onDelete={() =>
                                                    setDeleting(product)
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <DataTablePagination paginator={products} />
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
                                {t('Delete this product?')}
                            </DialogTitle>
                            <DialogDescription>
                                {deleting.orders_count > 0
                                    ? t(
                                          'This product has orders, so it cannot be deleted. Archive it instead.',
                                      )
                                    : t(
                                          '":name" and its images and files will be deleted.',
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
                                disabled={deleting.orders_count > 0}
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

ManageProducts.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Products', href: index() },
    ],
};

function RowActions({
    product,
    statuses,
    onDelete,
}: {
    product: ProductRow;
    statuses: ProductStatus[];
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
                    aria-label={t('Actions for :name', { name: product.title })}
                >
                    <EllipsisVertical />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={edit(product.id)}>
                        <Pencil />
                        {t('Edit')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <a
                        href={productShow.url(product.slug)}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <ExternalLink />
                        {t('View')}
                    </a>
                </DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <RefreshCw className="size-4 text-muted-foreground" />
                        {t('Change status')}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuRadioGroup
                            value={product.status}
                            onValueChange={(value) =>
                                router.patch(
                                    productStatus.url(product.id),
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
                                    {t(STATUS_LABEL[value])}
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
