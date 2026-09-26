import { router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';

export type Paginator = {
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    first_page_url: string;
    last_page_url: string;
    prev_page_url: string | null;
    next_page_url: string | null;
    path: string;
};

/**
 * Footer for admin tables: "Showing x to y of z entries", first/previous, a page picker, next/last.
 * Keeps the current filters in the query string.
 */
export function DataTablePagination({ paginator }: { paginator: Paginator }) {
    const { t } = useTranslation();

    const visit = (url: string | null) =>
        url &&
        router.get(url, {}, { preserveState: true, preserveScroll: true });

    const goToPage = (page: string) => {
        const url = new URL(paginator.first_page_url);
        url.searchParams.set('page', page);
        visit(url.toString());
    };

    const buttons = [
        {
            label: t('First page'),
            icon: ChevronsLeft,
            url: paginator.current_page > 1 ? paginator.first_page_url : null,
        },
        {
            label: t('Previous page'),
            icon: ChevronLeft,
            url: paginator.prev_page_url,
        },
    ];
    const trailing = [
        {
            label: t('Next page'),
            icon: ChevronRight,
            url: paginator.next_page_url,
        },
        {
            label: t('Last page'),
            icon: ChevronsRight,
            url:
                paginator.current_page < paginator.last_page
                    ? paginator.last_page_url
                    : null,
        },
    ];

    const navButton = (button: (typeof buttons)[number]) => (
        <Button
            key={button.label}
            variant="outline"
            size="icon"
            className="size-8"
            aria-label={button.label}
            disabled={!button.url}
            onClick={() => visit(button.url)}
        >
            <button.icon className="rtl:-scale-x-100" />
        </Button>
    );

    return (
        <div className="flex flex-col gap-4 border-t p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-center text-sm text-muted-foreground sm:text-start">
                {paginator.total > 0
                    ? t('Showing :from to :to of :total entries', {
                          from: paginator.from ?? 0,
                          to: paginator.to ?? 0,
                          total: paginator.total,
                      })
                    : t('No entries')}
            </p>
            <div className="flex items-center justify-center gap-2">
                {buttons.map(navButton)}
                <div className="mx-1 flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">{t('Page')}</span>
                    <Select
                        value={String(paginator.current_page)}
                        onValueChange={goToPage}
                    >
                        <SelectTrigger
                            size="sm"
                            className="min-w-14"
                            aria-label={t('Page')}
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from(
                                { length: paginator.last_page },
                                (_, i) => (
                                    <SelectItem
                                        key={i + 1}
                                        value={String(i + 1)}
                                    >
                                        {i + 1}
                                    </SelectItem>
                                ),
                            )}
                        </SelectContent>
                    </Select>
                    <span className="text-muted-foreground">
                        {t('of :count', { count: paginator.last_page })}
                    </span>
                </div>
                {trailing.map(navButton)}
            </div>
        </div>
    );
}
