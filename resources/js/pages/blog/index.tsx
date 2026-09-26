import { Head } from '@inertiajs/react';
import {
    CatalogLayout,
    CatalogPagination,
} from '@/components/landing/catalog-layout';
import type { CatalogFilters } from '@/components/landing/catalog-layout';
import { PostCard } from '@/components/landing/post-card';
import { useTranslation } from '@/hooks/use-translation';
import { index as blogIndex } from '@/routes/blog';
import type { CatalogCategory, Post } from '@/types';

type BlogProps = {
    posts: {
        data: Post[];
        from: number | null;
        to: number | null;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    categories: CatalogCategory[];
    filters: CatalogFilters;
};

export default function Blog({ posts, categories, filters }: BlogProps) {
    const { t } = useTranslation();
    const activeCategory = categories.find(
        (category) => category.slug === filters.category,
    );

    return (
        <>
            <Head title={t('Blog')}>
                <meta
                    name="description"
                    content={t(
                        'Articles from our instructors on traditional medicine, medical sciences, healthcare and management.',
                    )}
                />
            </Head>
            <CatalogLayout
                indexUrl={blogIndex.url()}
                searchLabel={t('Search articles')}
                categories={categories}
                filters={filters}
                filterGroups={[]}
            >
                <h1 className="mb-6 text-2xl font-bold">
                    {activeCategory
                        ? t(':category articles', {
                              category: activeCategory.name,
                          })
                        : t('All articles')}
                </h1>

                {posts.data.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {posts.data.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                ) : (
                    <p className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                        {t('No articles match these filters.')}
                    </p>
                )}

                <CatalogPagination paginator={posts} />
            </CatalogLayout>
        </>
    );
}
