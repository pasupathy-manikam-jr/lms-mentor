import { Link } from '@inertiajs/react';
import { Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CategoryIcon } from '@/components/landing/category-icon';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

export const formatDuration = (minutes: number) =>
    `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

/**
 * Card shell shared by courses and exams, in a grid (image on top) or list (image on the left) layout.
 */
export function CatalogCard({
    href,
    title,
    imageUrl,
    categoryIcon,
    meta,
    byline,
    rating,
    reviewsCount,
    price,
    compareAtPrice,
    actionLabel,
    layout = 'grid',
}: {
    href: string;
    title: string;
    imageUrl: string | null;
    categoryIcon: string;
    meta: { icon: LucideIcon; text: string }[];
    byline?: string;
    rating: string;
    reviewsCount: number;
    price: string;
    compareAtPrice: string | null;
    actionLabel: string;
    layout?: 'grid' | 'list';
}) {
    const isList = layout === 'list';
    const { t } = useTranslation();

    return (
        <Card
            className={cn(
                'group relative gap-4 overflow-hidden pt-0 hover:-translate-y-1 hover:shadow-lg',
                isList && 'sm:flex-row sm:gap-0 sm:py-0',
            )}
        >
            <div
                className={cn(
                    'flex aspect-square shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-950 dark:to-orange-900',
                    isList && 'sm:w-56',
                )}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <CategoryIcon
                        name={categoryIcon}
                        className="size-12 text-amber-700 transition-transform duration-500 group-hover:scale-110 dark:text-amber-300"
                    />
                )}
            </div>
            <div
                className={cn(
                    'flex flex-1 flex-col gap-4',
                    isList && 'sm:justify-center sm:py-6',
                )}
            >
                <CardHeader className="gap-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {meta.map((item) => (
                            <span
                                key={item.text}
                                className="flex items-center gap-1"
                            >
                                <item.icon className="size-3.5" aria-hidden />
                                {item.text}
                            </span>
                        ))}
                    </div>
                    <CardTitle className="leading-snug">
                        {/* The stretched link makes the whole card clickable. */}
                        <Link
                            href={href}
                            className="after:absolute after:inset-0"
                        >
                            {title}
                        </Link>
                    </CardTitle>
                    {byline && (
                        <p className="text-sm text-muted-foreground">
                            {t('by :name', { name: byline })}
                        </p>
                    )}
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star
                            className="size-3.5 fill-amber-400 text-amber-400"
                            aria-hidden
                        />
                        {reviewsCount === 1
                            ? t(':rating (:count review)', {
                                  rating,
                                  count: reviewsCount.toLocaleString(),
                              })
                            : t(':rating (:count reviews)', {
                                  rating,
                                  count: reviewsCount.toLocaleString(),
                              })}
                    </p>
                </CardHeader>
                <CardFooter className="mt-auto justify-between">
                    <p className="font-semibold">
                        {Number(price) === 0 ? t('Free') : `$${price}`}
                        {compareAtPrice && (
                            <span className="ml-2 text-sm font-normal text-muted-foreground line-through">
                                ${compareAtPrice}
                            </span>
                        )}
                    </p>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={href} className="relative">
                            {actionLabel}
                        </Link>
                    </Button>
                </CardFooter>
            </div>
        </Card>
    );
}
