import { Head, Link, router } from '@inertiajs/react';
import {
    EllipsisVertical,
    ExternalLink,
    Pencil,
    Plus,
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
    DropdownMenuSeparator,
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
import { dashboard } from '@/routes';
import { create, destroy, edit, index } from '@/routes/admin/blogs';
import { show as blogShow } from '@/routes/blog';

type PostRow = {
    id: number;
    title: string;
    slug: string;
    author_name: string;
    published_at: string | null;
    category: { id: number; name: string } | null;
};

type Filters = { search?: string; per_page?: number };

/**
 * Manage Blog, following the Mentor demo: Creator, Title, Category, Status and Action.
 */
export default function ManageBlogs({
    posts,
    filters,
}: {
    posts: Paginator & { data: PostRow[] };
    filters: Filters;
}) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleting, setDeleting] = useState<PostRow | null>(null);

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
            <Head title={t('Blog')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t('Blog')}
                    </h1>
                    <Button asChild>
                        <Link href={create()}>
                            <Plus />
                            {t('Add new blog')}
                        </Link>
                    </Button>
                </div>

                <Card className="gap-0 py-0">
                    <CardHeader className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                        <CardTitle className="text-lg">{t('Blog')}</CardTitle>
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
                                    aria-label={t('Search blogs')}
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
                                        {t('Creator')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        {t('Title')}
                                    </th>
                                    <th className="px-3 py-3 text-center font-medium">
                                        {t('Category')}
                                    </th>
                                    <th className="px-3 py-3 text-center font-medium">
                                        {t('Status')}
                                    </th>
                                    <th className="px-6 py-3 text-end font-medium">
                                        {t('Action')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-10 text-center"
                                        >
                                            {t('No blogs found.')}
                                        </td>
                                    </tr>
                                )}
                                {posts.data.map((post) => (
                                    <tr
                                        key={post.id}
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="px-6 py-3 font-medium">
                                            {post.author_name}
                                        </td>
                                        <td className="max-w-96 px-3 py-3">
                                            <Link
                                                href={edit(post.id)}
                                                className="hover:underline"
                                            >
                                                {post.title}
                                            </Link>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            {post.category?.name ?? '—'}
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <Badge
                                                variant={
                                                    post.published_at
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {post.published_at
                                                    ? t('Published')
                                                    : t('Draft')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-3 text-end">
                                            <RowActions
                                                post={post}
                                                onDelete={() =>
                                                    setDeleting(post)
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <DataTablePagination paginator={posts} />
                </Card>
            </div>

            {deleting && (
                <Dialog
                    open
                    onOpenChange={(open) => !open && setDeleting(null)}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('Delete this blog?')}</DialogTitle>
                            <DialogDescription>
                                {t('":name" will be deleted.', {
                                    name: deleting.title,
                                })}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">{t('Cancel')}</Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
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

ManageBlogs.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Blog', href: index() },
    ],
};

function RowActions({
    post,
    onDelete,
}: {
    post: PostRow;
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
                    aria-label={t('Actions for :name', { name: post.title })}
                >
                    <EllipsisVertical />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {post.published_at && (
                    <DropdownMenuItem asChild>
                        <a
                            href={blogShow.url(post.slug)}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <ExternalLink />
                            {t('View')}
                        </a>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                    <Link href={edit(post.id)}>
                        <Pencil />
                        {t('Edit')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                    <Trash2 />
                    {t('Delete')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
