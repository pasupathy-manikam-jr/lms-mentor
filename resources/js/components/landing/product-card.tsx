import { Package, ShoppingBag } from 'lucide-react';
import { CatalogCard } from '@/components/landing/catalog-card';
import { useTranslation } from '@/hooks/use-translation';
import { show } from '@/routes/store';
import type { Product } from '@/types';

export function ProductCard({
    product,
    layout = 'grid',
}: {
    product: Product;
    layout?: 'grid' | 'list';
}) {
    const { t } = useTranslation();

    return (
        <CatalogCard
            href={show.url(product.slug)}
            title={product.title}
            imageUrl={product.image_url}
            categoryIcon={product.category.icon}
            meta={[
                { icon: Package, text: product.type },
                {
                    icon: ShoppingBag,
                    text: t(':count sold', {
                        count: product.sales_count.toLocaleString(),
                    }),
                },
            ]}
            byline={product.instructor?.name}
            rating={product.rating}
            reviewsCount={product.reviews_count}
            price={product.price}
            compareAtPrice={product.compare_at_price}
            actionLabel={t('View')}
            layout={layout}
        />
    );
}
