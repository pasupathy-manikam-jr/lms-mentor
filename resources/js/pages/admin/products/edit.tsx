import { Head, router, setLayoutProps } from '@inertiajs/react';
import {
    BookText,
    ChevronDown,
    CircleDollarSign,
    Eye,
    FlaskConical,
    FolderInput,
    Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
    CoursePricingFields,
    CourseSeoFields,
    ImageField,
} from '@/components/admin/course-form';
import { InfoLists } from '@/components/admin/course-info';
import type { InfoItem } from '@/components/admin/course-info';
import { ProductAssets } from '@/components/admin/product-assets';
import type {
    GalleryImage,
    ProductFile,
} from '@/components/admin/product-assets';
import {
    ProductDetailFields,
    ProductStockField,
    ProductTextFields,
    submitProductForm,
    useProductForm,
} from '@/components/admin/product-form';
import type {
    ProductFormOptions,
    ProductFormValues,
} from '@/components/admin/product-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { EXAM_STATUS_LABEL as STATUS_LABEL } from '@/pages/admin/exams/index';
import type { ProductStatus } from '@/pages/admin/products/index';
import { dashboard } from '@/routes';
import { edit, index, status as productStatus } from '@/routes/admin/products';
import info from '@/routes/admin/products/info';
import { show as productShow } from '@/routes/store';

type Tab = 'basic' | 'pricing' | 'media' | 'info' | 'seo';

const TABS: { value: Tab; label: string; icon: LucideIcon }[] = [
    { value: 'basic', label: 'Basic', icon: Settings },
    { value: 'pricing', label: 'Pricing', icon: CircleDollarSign },
    { value: 'media', label: 'Media & files', icon: FolderInput },
    { value: 'info', label: 'Info', icon: BookText },
    { value: 'seo', label: 'SEO', icon: FlaskConical },
];

/** Which tab holds each field, so a failed save shows the field with the error. */
const FIELD_TABS: Record<string, Tab> = {
    pricing_type: 'pricing',
    price: 'pricing',
    discount_price: 'pricing',
    stock: 'pricing',
    thumbnail: 'media',
    meta_title: 'seo',
    meta_keywords: 'seo',
    meta_description: 'seo',
    og_title: 'seo',
    og_description: 'seo',
};

/** The demo's status menu is tinted by the current status. */
const STATUS_TONE: Record<ProductStatus, string> = {
    published:
        'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400',
    draft: 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-500/20 dark:bg-zinc-500/10 dark:text-zinc-300',
    archived:
        'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400',
};

/**
 * The product editor ("Manage Product"), following the Mentor demo: a status menu and tabs Basic,
 * Pricing, Media & Files, Info and SEO.
 */
export default function EditProduct({
    product,
    slug,
    status,
    statuses,
    gallery,
    files,
    info: infoLists,
    ...options
}: ProductFormOptions & {
    product: ProductFormValues;
    slug: string;
    status: ProductStatus;
    statuses: ProductStatus[];
    gallery: GalleryImage[];
    files: ProductFile[];
    info: Partial<Record<'specification' | 'faq', InfoItem[]>>;
}) {
    const { t } = useTranslation();
    const form = useProductForm(product);
    const [tab, setTab] = useState<Tab>(() => {
        const requested = new URLSearchParams(
            typeof window === 'undefined' ? '' : window.location.search,
        ).get('tab');

        return TABS.some((item) => item.value === requested)
            ? (requested as Tab)
            : 'basic';
    });

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Products', href: index() },
            { title: product.title, href: edit(product.id) },
        ],
    });

    const firstErrorTab = Object.keys(form.errors).map(
        (field) => FIELD_TABS[field] ?? 'basic',
    )[0];
    const [shownErrors, setShownErrors] = useState(form.errors);

    if (shownErrors !== form.errors) {
        setShownErrors(form.errors);

        if (firstErrorTab) {
            setTab(firstErrorTab);
        }
    }

    const save = (event: FormEvent) => {
        event.preventDefault();
        submitProductForm(form, product.id);
    };

    const saveBar = (
        <div className="text-end">
            <Button type="submit" disabled={form.processing}>
                {form.processing && <Spinner />}
                {t('Save changes')}
            </Button>
        </div>
    );

    return (
        <>
            <Head title={`${t('Manage product')} · ${product.title}`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {t('Manage product')}
                        </h1>
                        <p className="truncate text-sm text-muted-foreground">
                            {product.title}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <Button variant="outline" asChild>
                            <a
                                href={productShow.url(slug)}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Eye />
                                {t('Preview')}
                            </a>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'gap-2 px-3 text-xs font-semibold',
                                        STATUS_TONE[status],
                                    )}
                                >
                                    <span className="size-2 rounded-full bg-current" />
                                    {t(STATUS_LABEL[status])}
                                    <ChevronDown className="size-3.5 opacity-60" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuRadioGroup
                                    value={status}
                                    onValueChange={(value) =>
                                        router.patch(
                                            productStatus.url(product.id),
                                            { status: value },
                                            {
                                                preserveScroll: true,
                                                preserveState: true,
                                            },
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
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-4">
                    <div
                        role="tablist"
                        aria-orientation="vertical"
                        className="flex h-fit gap-1 overflow-x-auto rounded-2xl border bg-card py-2 text-card-foreground shadow-sm md:flex-col md:py-5"
                    >
                        {TABS.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                role="tab"
                                id={`tab-${item.value}`}
                                aria-selected={tab === item.value}
                                aria-controls={`panel-${item.value}`}
                                onClick={() => setTab(item.value)}
                                className={cn(
                                    'relative flex shrink-0 cursor-pointer items-center gap-3 px-5 py-3 text-start text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                    tab === item.value &&
                                        'bg-muted before:absolute before:inset-y-0 before:start-0 before:w-1 before:rounded-e-xl before:bg-primary',
                                )}
                            >
                                <item.icon className="size-4" />
                                {t(item.label)}
                            </button>
                        ))}
                    </div>

                    <div
                        role="tabpanel"
                        id={`panel-${tab}`}
                        aria-labelledby={`tab-${tab}`}
                        className="min-w-0 space-y-5 md:col-span-3"
                    >
                        {tab === 'basic' && (
                            <TabForm onSubmit={save}>
                                <ProductTextFields form={form} />
                                <ProductDetailFields
                                    form={form}
                                    options={options}
                                />
                                {saveBar}
                            </TabForm>
                        )}

                        {tab === 'pricing' && (
                            <TabForm onSubmit={save}>
                                <CoursePricingFields
                                    form={form}
                                    priceLabel={t(
                                        'Enter your product price ($0)',
                                    )}
                                    showExpiry={false}
                                />
                                <ProductStockField form={form} />
                                {saveBar}
                            </TabForm>
                        )}

                        {tab === 'media' && (
                            <>
                                <TabForm onSubmit={save}>
                                    <ImageField
                                        form={form}
                                        name="thumbnail"
                                        label={t('Thumbnail')}
                                        currentUrl={product.image_url}
                                    />
                                    {saveBar}
                                </TabForm>
                                <ProductAssets
                                    productId={product.id}
                                    productSlug={slug}
                                    gallery={gallery}
                                    files={files}
                                />
                            </>
                        )}

                        {tab === 'info' && (
                            <Card className="p-0">
                                <InfoLists
                                    config={{
                                        specification: {
                                            tab: 'Specifications',
                                            add: 'Add specification',
                                            create: 'Create specification',
                                            update: 'Update specification',
                                            field: 'Label',
                                            body: 'Value',
                                        },
                                        faq: {
                                            tab: 'FAQs',
                                            add: 'Add FAQ',
                                            create: 'Create FAQ',
                                            update: 'Update FAQ',
                                            field: 'Question',
                                            body: 'Answer',
                                        },
                                    }}
                                    lists={infoLists}
                                    urls={{
                                        store: info.store.url(product.id),
                                        update: (id) =>
                                            info.update.url({
                                                product: product.id,
                                                infoItem: id,
                                            }),
                                        destroy: (id) =>
                                            info.destroy.url({
                                                product: product.id,
                                                infoItem: id,
                                            }),
                                    }}
                                />
                            </Card>
                        )}

                        {tab === 'seo' && (
                            <TabForm onSubmit={save}>
                                <CourseSeoFields form={form} />
                                {saveBar}
                            </TabForm>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function TabForm({
    onSubmit,
    children,
}: {
    onSubmit: (event: FormEvent) => void;
    children: ReactNode;
}) {
    return (
        <Card className="p-4 sm:p-6">
            <form onSubmit={onSubmit} className="space-y-6">
                {children}
            </form>
        </Card>
    );
}
