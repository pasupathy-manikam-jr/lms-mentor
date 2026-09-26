import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    CatalogHeading,
    CatalogLayout,
    CatalogPagination,
    storeFilterGroups,
} from '@/components/landing/catalog-layout';
import type {
    CatalogFilters,
    CatalogView,
} from '@/components/landing/catalog-layout';
import { ProductCard } from '@/components/landing/product-card';
import { useTranslation } from '@/hooks/use-translation';
import { index as storeIndex } from '@/routes/store';
import type { CatalogCategory, Product } from '@/types';

type StoreProps = {
    products: {
        data: Product[];
        from: number | null;
        to: number | null;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    categories: CatalogCategory[];
    filters: CatalogFilters;
};

export default function Store({ products, categories, filters }: StoreProps) {
    const { t } = useTranslation();
    const [view, setView] = useState<CatalogView>('grid');

    const activeCategory = categories.find(
        (category) => category.slug === filters.category,
    );

    return (
        <>
            <Head title={t('Store')} />
            <CatalogLayout
                indexUrl={storeIndex.url()}
                searchLabel={t('Search the store')}
                categories={categories}
                filters={filters}
                filterGroups={storeFilterGroups}
            >
                <CatalogHeading
                    title={
                        activeCategory
                            ? t(':category products', {
                                  category: activeCategory.name,
                              })
                            : t('All products')
                    }
                    view={view}
                    onViewChange={setView}
                />

                {products.data.length > 0 ? (
                    <div
                        className={
                            view === 'grid'
                                ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
                                : 'grid gap-4'
                        }
                    >
                        {products.data.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                layout={view}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                        {t('No products match these filters.')}
                    </p>
                )}

                <CatalogPagination paginator={products} />
            </CatalogLayout>
        </>
    );
}
