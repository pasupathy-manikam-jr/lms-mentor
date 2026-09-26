import { Head, Link, router } from '@inertiajs/react';
import {
    EllipsisVertical,
    ExternalLink,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import { create, destroy, edit, index } from '@/routes/admin/pages';

type PageRow = {
    id: number;
    slug: string;
    title: string;
    kind: 'home' | 'about' | 'team' | 'careers' | 'custom';
    is_published: boolean;
    url: string;
};

/**
 * Frontend → Pages, following the Mentor demo: the home page and the inner pages as cards, each with
 * View and Edit.
 */
export default function Pages({ pages }: { pages: PageRow[] }) {
    const { t } = useTranslation();
    const [deleting, setDeleting] = useState<PageRow | null>(null);

    const groups = [
        { title: 'Home page', items: pages.filter((p) => p.kind === 'home') },
        { title: 'Inner pages', items: pages.filter((p) => p.kind !== 'home') },
    ];

    return (
        <>
            <Head title={t('Pages')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t('Pages')}
                    </h1>
                    <Button asChild>
                        <Link href={create()}>
                            <Plus />
                            {t('Create page')}
                        </Link>
                    </Button>
                </div>

                {groups.map((group) => (
                    <section key={group.title} className="space-y-3">
                        <h2 className="font-medium">{t(group.title)}</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {group.items.map((page) => (
                                <div
                                    key={page.id}
                                    className="relative flex items-center justify-between gap-2 rounded-xl border bg-card px-5 py-6 shadow-sm transition-shadow hover:shadow-md"
                                >
                                    <div className="min-w-0">
                                        <Link
                                            href={edit(page.id)}
                                            className="block truncate text-lg font-semibold after:absolute after:inset-0"
                                        >
                                            {page.kind === 'custom'
                                                ? page.title
                                                : t(page.title)}
                                        </Link>
                                        {!page.is_published && (
                                            <Badge
                                                variant="secondary"
                                                className="mt-1"
                                            >
                                                {t('Draft')}
                                            </Badge>
                                        )}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="relative z-10 rounded-full"
                                                aria-label={t(
                                                    'Actions for :name',
                                                    { name: page.title },
                                                )}
                                            >
                                                <EllipsisVertical />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <a
                                                    href={page.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <ExternalLink />
                                                    {t('View')}
                                                </a>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={edit(page.id)}>
                                                    <Pencil />
                                                    {t('Edit')}
                                                </Link>
                                            </DropdownMenuItem>
                                            {page.kind === 'custom' && (
                                                <>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onSelect={() =>
                                                            setDeleting(page)
                                                        }
                                                    >
                                                        <Trash2 />
                                                        {t('Delete')}
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            {deleting && (
                <Dialog
                    open
                    onOpenChange={(open) => !open && setDeleting(null)}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('Delete this page?')}</DialogTitle>
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

Pages.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Pages', href: index() },
    ],
};
