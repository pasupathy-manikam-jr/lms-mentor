import { Head, Link } from '@inertiajs/react';
import { CatalogLayout } from '@/components/landing/catalog-layout';
import { PostCard, timeAgo } from '@/components/landing/post-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from '@/hooks/use-translation';
import { index as blogIndex } from '@/routes/blog';
import type { CatalogCategory, Post, PostDetail } from '@/types';

type PostShowProps = {
    post: PostDetail;
    relatedPosts: Post[];
    categories: CatalogCategory[];
};

export default function PostShow({
    post,
    relatedPosts,
    categories,
}: PostShowProps) {
    const { t, locale } = useTranslation();
    const getInitials = useInitials();
    const categoryUrl = post.category
        ? blogIndex.url({ query: { category: post.category.slug } })
        : null;

    return (
        <>
            <Head title={post.title}>
                {post.excerpt && (
                    <meta name="description" content={post.excerpt} />
                )}
                {post.keywords && (
                    <meta name="keywords" content={post.keywords} />
                )}
            </Head>
            <CatalogLayout
                indexUrl={blogIndex.url()}
                searchLabel={t('Search articles')}
                categories={categories}
                filters={{ category: post.category?.slug }}
                filterGroups={[]}
            >
                <article className="mx-auto max-w-3xl space-y-6">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href={blogIndex()}>{t('Blog')}</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {post.category && categoryUrl && (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbLink asChild>
                                            <Link href={categoryUrl}>
                                                {post.category.name}
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </>
                            )}
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="line-clamp-1">
                                    {post.title}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <header className="space-y-4">
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                            {post.title}
                        </h1>
                        {post.excerpt && (
                            <p className="text-lg text-muted-foreground">
                                {post.excerpt}
                            </p>
                        )}
                        <div className="flex items-center gap-3 text-sm">
                            <Avatar className="size-9">
                                <AvatarFallback>
                                    {getInitials(
                                        post.author_name.replace(
                                            /^(Dr|Prof)\.\s*/,
                                            '',
                                        ),
                                    )}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">
                                    {post.author_name}
                                </p>
                                <p className="text-muted-foreground">
                                    {t(':minutes min read', {
                                        minutes: post.read_minutes,
                                    })}{' '}
                                    · {timeAgo(post.published_at, locale)}
                                </p>
                            </div>
                        </div>
                    </header>

                    {(post.banner_url ?? post.image_url) && (
                        <img
                            src={post.banner_url ?? post.image_url ?? ''}
                            alt=""
                            className="aspect-[2/1] w-full rounded-xl object-cover"
                        />
                    )}

                    {post.body && (
                        <div
                            className="rich-text text-base leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: post.body }}
                        />
                    )}
                </article>

                {relatedPosts.length > 0 && post.category && (
                    <section className="mt-12">
                        <h2 className="mb-6 text-2xl font-bold">
                            {t('More in :category', {
                                category: post.category.name,
                            })}
                        </h2>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {relatedPosts.map((related) => (
                                <PostCard key={related.id} post={related} />
                            ))}
                        </div>
                    </section>
                )}
            </CatalogLayout>
        </>
    );
}
