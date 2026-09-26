import { Link } from '@inertiajs/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from '@/hooks/use-translation';
import { show } from '@/routes/blog';
import type { Post } from '@/types';

/** "3 days ago", "yesterday", etc. */
export const timeAgo = (date: string, locale: string = 'en') => {
    const days = Math.round((Date.parse(date) - Date.now()) / 86_400_000);

    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
        days,
        'day',
    );
};

export function PostCard({ post }: { post: Post }) {
    const getInitials = useInitials();
    const { t, locale } = useTranslation();

    return (
        <Card className="group relative gap-4 overflow-hidden pt-0 hover:-translate-y-1 hover:shadow-lg">
            <div className="overflow-hidden">
                {post.image_url && (
                    <img
                        src={post.image_url}
                        alt=""
                        loading="lazy"
                        className="aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                )}
            </div>
            <CardHeader>
                <CardTitle className="leading-snug">
                    {/* The stretched link makes the whole card clickable. */}
                    <Link
                        href={show.url(post.slug)}
                        className="after:absolute after:inset-0"
                    >
                        {post.title}
                    </Link>
                </CardTitle>
            </CardHeader>
            <CardFooter className="mt-auto gap-3 text-sm">
                <Avatar className="size-8">
                    <AvatarFallback className="text-xs">
                        {getInitials(
                            post.author_name.replace(/^(Dr|Prof)\.\s*/, ''),
                        )}
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{post.author_name}</p>
                    <p className="flex justify-between gap-2 text-muted-foreground">
                        <span>
                            {t(':minutes min read', {
                                minutes: post.read_minutes,
                            })}
                        </span>
                        <span>{timeAgo(post.published_at, locale)}</span>
                    </p>
                </div>
            </CardFooter>
        </Card>
    );
}
