import { Head, Link, usePage } from '@inertiajs/react';
import {
    FileText,
    FolderOpen,
    Infinity as InfinityIcon,
    Package,
    ShoppingBag,
    Star,
} from 'lucide-react';
import { Download } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    CatalogLayout,
    storeFilterGroups,
} from '@/components/landing/catalog-layout';
import { ProductCard } from '@/components/landing/product-card';
import { PurchaseAction } from '@/components/landing/purchase-action';
import type { Ownership } from '@/components/landing/purchase-action';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from '@/hooks/use-translation';
import { register } from '@/routes';
import { index as storeIndex } from '@/routes/store';
import { download } from '@/routes/store/files';
import { show as teamShow } from '@/routes/team';
import type { CatalogCategory, Category, Instructor, Product } from '@/types';

type ProductShowProps = {
    product: Omit<Product, 'category' | 'instructor'> & {
        category: Omit<Category, 'courses_count'>;
        instructor: Instructor | null;
        /** Sanitized HTML from the product editor. */
        description: string | null;
        meta_title: string | null;
        meta_keywords: string | null;
        meta_description: string | null;
        og_title: string | null;
        og_description: string | null;
    };
    /** Public URLs of the gallery images. */
    gallery: string[];
    /** Specifications and FAQs from the editor's Info tab. */
    info: Partial<
        Record<
            'specification' | 'faq',
            { id: number; title: string; body: string }[]
        >
    >;
    relatedProducts: Product[];
    categories: CatalogCategory[];
    ownership: Ownership;
    files: { id: number; name: string; size: number }[];
};

export default function ProductShow({
    product,
    gallery,
    info,
    relatedProducts,
    categories,
    ownership,
    files,
}: ProductShowProps) {
    const { auth } = usePage().props;
    const { t } = useTranslation();
    const getInitials = useInitials();
    const categoryUrl = storeIndex.url({
        query: { category: product.category.slug },
    });
    const isFree = Number(product.price) === 0;

    const facts: { icon: LucideIcon; label: string; value: string }[] = [
        { icon: Package, label: t('Type'), value: product.type },
        { icon: FileText, label: t('Format'), value: product.format },
        {
            icon: FolderOpen,
            label: t('Category'),
            value: product.category.name,
        },
        {
            icon: ShoppingBag,
            label: t('Sold'),
            value: product.sales_count.toLocaleString(),
        },
        {
            icon: InfinityIcon,
            label: t('Access'),
            value: t('Lifetime downloads'),
        },
    ];

    return (
        <>
            <Head title={product.meta_title || product.title}>
                {(product.meta_description || product.summary) && (
                    <meta
                        name="description"
                        content={
                            product.meta_description || product.summary || ''
                        }
                    />
                )}
                {product.meta_keywords && (
                    <meta name="keywords" content={product.meta_keywords} />
                )}
                <meta
                    property="og:title"
                    content={
                        product.og_title || product.meta_title || product.title
                    }
                />
                {product.og_description && (
                    <meta
                        property="og:description"
                        content={product.og_description}
                    />
                )}
                {product.image_url && (
                    <meta property="og:image" content={product.image_url} />
                )}
            </Head>
            <CatalogLayout
                indexUrl={storeIndex.url()}
                searchLabel={t('Search the store')}
                categories={categories}
                filters={{ category: product.category.slug }}
                filterGroups={storeFilterGroups}
            >
                <div className="grid items-start gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href={storeIndex()}>
                                            {t('Store')}
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href={categoryUrl}>
                                            {product.category.name}
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="line-clamp-1">
                                        {product.title}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        <div className="space-y-4">
                            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                                {product.title}
                            </h1>
                            {product.summary && (
                                <p className="text-lg text-muted-foreground">
                                    {product.summary}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                                {product.instructor && (
                                    <span className="flex items-center gap-2 font-medium">
                                        <Avatar className="size-8">
                                            {product.instructor.avatar_url && (
                                                <AvatarImage
                                                    src={
                                                        product.instructor
                                                            .avatar_url
                                                    }
                                                    alt=""
                                                />
                                            )}
                                            <AvatarFallback>
                                                {getInitials(
                                                    product.instructor.name,
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <Link
                                            href={teamShow.url(
                                                product.instructor.id,
                                            )}
                                            className="hover:underline"
                                        >
                                            {product.instructor.name}
                                        </Link>
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Star
                                        className="size-4 fill-amber-400 text-amber-400"
                                        aria-hidden
                                    />
                                    <span className="font-semibold">
                                        {product.rating}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {t(
                                            product.reviews_count === 1
                                                ? '(:count review)'
                                                : '(:count reviews)',
                                            {
                                                count: product.reviews_count.toLocaleString(),
                                            },
                                        )}
                                    </span>
                                </span>
                                <Badge variant="secondary">
                                    {product.type}
                                </Badge>
                            </div>
                        </div>

                        {gallery.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {gallery.map((src) => (
                                    <a
                                        key={src}
                                        href={src}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <img
                                            src={src}
                                            alt=""
                                            className="aspect-square w-full rounded-lg border object-cover"
                                        />
                                    </a>
                                ))}
                            </div>
                        )}

                        {files.length > 0 && (
                            <Card id="downloads" className="scroll-mt-24">
                                <CardHeader>
                                    <CardTitle>{t('Your downloads')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {files.map((file) => (
                                            <li key={file.id}>
                                                <a
                                                    href={download.url({
                                                        product: product.slug,
                                                        asset: file.id,
                                                    })}
                                                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                                                >
                                                    <span className="flex min-w-0 items-center gap-2">
                                                        <Download className="size-4 shrink-0 text-muted-foreground" />
                                                        <span className="truncate">
                                                            {file.name}
                                                        </span>
                                                    </span>
                                                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                                        {(
                                                            file.size /
                                                            1024 /
                                                            1024
                                                        ).toFixed(1)}{' '}
                                                        MB
                                                    </span>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {product.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {t('About this product')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent
                                    className="rich-text"
                                    dangerouslySetInnerHTML={{
                                        __html: product.description,
                                    }}
                                />
                            </Card>
                        )}

                        {!!info.specification?.length && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('Specifications')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <dl className="divide-y text-sm">
                                        {info.specification.map((item) => (
                                            <div
                                                key={item.id}
                                                className="grid grid-cols-3 gap-4 py-2"
                                            >
                                                <dt className="text-muted-foreground">
                                                    {item.title}
                                                </dt>
                                                <dd className="col-span-2">
                                                    {item.body}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </CardContent>
                            </Card>
                        )}

                        {!!info.faq?.length && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('FAQs')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible>
                                        {info.faq.map((item) => (
                                            <AccordionItem
                                                key={item.id}
                                                value={String(item.id)}
                                            >
                                                <AccordionTrigger className="text-start">
                                                    {item.title}
                                                </AccordionTrigger>
                                                <AccordionContent className="whitespace-pre-line text-muted-foreground">
                                                    {item.body}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        )}

                        {product.instructor && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('Created by')}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex items-center gap-4">
                                    <Avatar className="size-14">
                                        {product.instructor.avatar_url && (
                                            <AvatarImage
                                                src={
                                                    product.instructor
                                                        .avatar_url
                                                }
                                                alt=""
                                            />
                                        )}
                                        <AvatarFallback>
                                            {getInitials(
                                                product.instructor.name,
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">
                                            <Link
                                                href={teamShow.url(
                                                    product.instructor.id,
                                                )}
                                                className="hover:underline"
                                            >
                                                {product.instructor.name}
                                            </Link>
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {product.instructor.title}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <Card className="gap-4 overflow-hidden pt-0 lg:sticky lg:top-6">
                        {product.image_url && (
                            <img
                                src={product.image_url}
                                alt=""
                                className="aspect-video w-full object-cover"
                            />
                        )}
                        <CardContent
                            className={
                                product.image_url
                                    ? 'space-y-4'
                                    : 'space-y-4 pt-6'
                            }
                        >
                            <p className="text-3xl font-bold">
                                {isFree ? t('Free') : `$${product.price}`}
                                {product.compare_at_price && (
                                    <span className="ml-2 text-base font-normal text-muted-foreground line-through">
                                        ${product.compare_at_price}
                                    </span>
                                )}
                            </p>
                            {product.stock === 0 && ownership !== 'owned' ? (
                                <Button className="w-full" disabled>
                                    {t('Sold out')}
                                </Button>
                            ) : (
                                <PurchaseAction
                                    type="product"
                                    slug={product.slug}
                                    price={product.price}
                                    isSignedIn={!!auth.user}
                                    ownership={ownership}
                                    freeLabel={t('Download free')}
                                    buyLabel={t('Buy now')}
                                    owned={
                                        <Button className="w-full" asChild>
                                            <a href="#downloads">
                                                {t('Go to your downloads')}
                                            </a>
                                        </Button>
                                    }
                                />
                            )}
                            <Separator />
                            <dl className="space-y-3 text-sm">
                                {facts.map((fact) => (
                                    <div
                                        key={fact.label}
                                        className="flex items-center justify-between gap-4"
                                    >
                                        <dt className="flex shrink-0 items-center gap-2 text-muted-foreground">
                                            <fact.icon
                                                className="size-4"
                                                aria-hidden
                                            />
                                            {fact.label}
                                        </dt>
                                        <dd className="text-right font-medium">
                                            {fact.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </CardContent>
                    </Card>
                </div>

                {relatedProducts.length > 0 && (
                    <section className="mt-12">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <h2 className="text-2xl font-bold">
                                {t('More in :category', {
                                    category: product.category.name,
                                })}
                            </h2>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={categoryUrl}>{t('View all')}</Link>
                            </Button>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {relatedProducts.map((related) => (
                                <ProductCard
                                    key={related.id}
                                    product={related}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </CatalogLayout>
        </>
    );
}
