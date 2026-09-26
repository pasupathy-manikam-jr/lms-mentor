import { Link, router } from '@inertiajs/react';
import {
    ArrowDownWideNarrow,
    ArrowUpNarrowWide,
    BadgeDollarSign,
    Clock,
    ChevronLeft,
    ChevronRight,
    Gift,
    LayoutGrid,
    List,
    Search,
    Star,
    TrendingUp,
    BatteryFull,
    BatteryLow,
    BatteryMedium,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import AppLogo from '@/components/app-logo';
import { AppShell } from '@/components/app-shell';
import { CategoryIcon } from '@/components/landing/category-icon';
import { SiteFooter } from '@/components/landing/site-footer';
import {
    AuthButtons,
    NavLink,
    navLinks,
    ThemeToggle,
} from '@/components/landing/site-header';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInput,
    SidebarInset,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { useCustomization } from '@/hooks/use-customization';
import { home } from '@/routes';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTranslation } from '@/hooks/use-translation';
import type { CatalogCategory } from '@/types';

export type CatalogFilters = {
    search?: string;
    category?: string;
    price?: 'free' | 'paid';
    level?: 'beginner' | 'intermediate' | 'advanced';
    sort?: 'price_high' | 'price_low' | 'bestsellers' | 'top_rated';
};

type Filters = CatalogFilters;

type FilterOption = { value?: string; label: string; icon: LucideIcon };

type FilterGroup = {
    key: 'price' | 'level' | 'sort';
    label: string;
    options: FilterOption[];
};

// Single-choice sidebar groups; the first option of each clears the filter.
const priceGroup: FilterGroup = {
    key: 'price',
    label: 'Price',
    options: [
        { label: 'All prices', icon: LayoutGrid },
        { value: 'free', label: 'Free', icon: Gift },
        { value: 'paid', label: 'Paid', icon: BadgeDollarSign },
    ],
};

const levelGroup: FilterGroup = {
    key: 'level',
    label: 'Level',
    options: [
        { label: 'All levels', icon: LayoutGrid },
        { value: 'beginner', label: 'Beginner', icon: BatteryLow },
        { value: 'intermediate', label: 'Intermediate', icon: BatteryMedium },
        { value: 'advanced', label: 'Advanced', icon: BatteryFull },
    ],
};

export const sortGroup: FilterGroup = {
    key: 'sort',
    label: 'Sort by',
    options: [
        { label: 'Newest', icon: Clock },
        {
            value: 'price_high',
            label: 'Highest price',
            icon: ArrowDownWideNarrow,
        },
        { value: 'price_low', label: 'Lowest price', icon: ArrowUpNarrowWide },
        { value: 'bestsellers', label: 'Bestsellers', icon: TrendingUp },
        { value: 'top_rated', label: 'Top rated', icon: Star },
    ],
};

export const defaultFilterGroups = [priceGroup, levelGroup];
export const storeFilterGroups = [priceGroup, sortGroup];

/**
 * Catalog pages (courses, exams, store): filter sidebar (starter kit Sidebar), site links on top, site footer below.
 * Picking a filter always lands on the list at indexUrl, so it works from a detail page too.
 */
export function CatalogLayout({
    indexUrl,
    searchLabel,
    categories,
    filters = {},
    filterGroups = defaultFilterGroups,
    children,
}: {
    indexUrl: string;
    searchLabel: string;
    categories: CatalogCategory[];
    filters?: Filters;
    filterGroups?: FilterGroup[];
    children: ReactNode;
}) {
    const { customization } = useCustomization();
    const [search, setSearch] = useState(filters.search ?? '');
    const { t } = useTranslation();

    const applyFilters = (changes: Filters) =>
        router.get(
            indexUrl,
            // Drop empty values so the URL stays clean.
            Object.fromEntries(
                Object.entries({ ...filters, ...changes }).filter(
                    ([, value]) => value,
                ),
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );

    return (
        <AppShell variant="sidebar">
            <Sidebar
                collapsible="icon"
                variant="inset"
                // Keep the sidebar on the reading-start side when the layout direction is right to left.
                side={customization.direction === 'rtl' ? 'right' : 'left'}
            >
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <Link href={home()}>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                    <form
                        role="search"
                        className="relative group-data-[collapsible=icon]:hidden"
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilters({ search });
                        }}
                    >
                        <Search
                            className="absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground"
                            aria-hidden
                        />
                        <SidebarInput
                            type="search"
                            aria-label={searchLabel}
                            placeholder={searchLabel}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </form>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>{t('Categories')}</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    isActive={!filters.category}
                                    tooltip={{ children: t('All categories') }}
                                    onClick={() =>
                                        applyFilters({
                                            category: undefined,
                                        })
                                    }
                                >
                                    <LayoutGrid />
                                    <span>{t('All categories')}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            {categories.map((category) => (
                                <SidebarMenuItem key={category.id}>
                                    <SidebarMenuButton
                                        isActive={
                                            filters.category === category.slug
                                        }
                                        tooltip={{
                                            children: category.name,
                                        }}
                                        onClick={() =>
                                            applyFilters({
                                                category: category.slug,
                                            })
                                        }
                                    >
                                        <CategoryIcon name={category.icon} />
                                        <span>{category.name}</span>
                                    </SidebarMenuButton>
                                    <SidebarMenuBadge>
                                        {category.items_count}
                                    </SidebarMenuBadge>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>

                    {filterGroups.map((group) => (
                        <SidebarGroup key={group.key}>
                            <SidebarGroupLabel>
                                {t(group.label)}
                            </SidebarGroupLabel>
                            <SidebarMenu>
                                {group.options.map((option) => (
                                    <SidebarMenuItem key={option.label}>
                                        <SidebarMenuButton
                                            isActive={
                                                filters[group.key] ===
                                                option.value
                                            }
                                            tooltip={{
                                                children: t(option.label),
                                            }}
                                            onClick={() =>
                                                applyFilters({
                                                    [group.key]: option.value,
                                                })
                                            }
                                        >
                                            <option.icon />
                                            <span>{t(option.label)}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                    ))}

                    {/* The top nav links are hidden on small screens, so list them here instead. */}
                    <SidebarGroup className="lg:hidden">
                        <SidebarGroupLabel>{t('Menu')}</SidebarGroupLabel>
                        <SidebarMenu>
                            {navLinks.map((link) => (
                                <SidebarMenuItem key={t(link.label)}>
                                    <SidebarMenuButton asChild>
                                        <NavLink href={link.href} className="">
                                            {t(link.label)}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter>
                    <NavUser />
                </SidebarFooter>
            </Sidebar>

            <SidebarInset className="min-w-0 overflow-x-clip">
                <header className="flex h-16 shrink-0 items-center gap-4 border-b border-sidebar-border/50 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <nav className="hidden gap-5 text-sm lg:flex">
                        {navLinks.map((link) => (
                            <NavLink
                                key={t(link.label)}
                                href={link.href}
                                className="text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {t(link.label)}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="ml-auto flex items-center gap-2 text-sm">
                        <LanguageSwitcher />
                        <ThemeToggle />
                        <AuthButtons />
                    </div>
                </header>

                <div className="flex-1 p-4 md:p-6">{children}</div>

                <SiteFooter />
            </SidebarInset>
        </AppShell>
    );
}

export type CatalogView = 'grid' | 'list';

/**
 * The title row of a catalog list: heading on the left, grid/list switch on the right.
 */
export function CatalogHeading({
    title,
    as: Heading = 'h1',
    view,
    onViewChange,
}: {
    title: string;
    /** Use h2 when the page already has its own h1. */
    as?: 'h1' | 'h2';
    view: CatalogView;
    onViewChange: (view: CatalogView) => void;
}) {
    const { t } = useTranslation();

    return (
        <div className="mb-6 flex items-center justify-between gap-4">
            <Heading className="text-2xl font-bold">{title}</Heading>
            <ToggleGroup
                type="single"
                variant="outline"
                value={view}
                onValueChange={(value) =>
                    value && onViewChange(value as CatalogView)
                }
            >
                <ToggleGroupItem value="grid" aria-label={t('Grid view')}>
                    <LayoutGrid />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label={t('List view')}>
                    <List />
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
}

/**
 * "Showing x to y of z" with previous/next links for a Laravel paginator.
 */
export function CatalogPagination({
    paginator,
}: {
    paginator: {
        from: number | null;
        to: number | null;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
}) {
    const { t } = useTranslation();

    if (paginator.total === 0) {
        return null;
    }

    const pageLinks = [
        {
            url: paginator.prev_page_url,
            label: t('Previous page'),
            icon: ChevronLeft,
        },
        {
            url: paginator.next_page_url,
            label: t('Next page'),
            icon: ChevronRight,
        },
    ];

    return (
        <nav
            aria-label={t('Pagination')}
            className="mt-8 flex items-center justify-between gap-4 border-t pt-6 text-sm"
        >
            <p className="text-muted-foreground">
                {/* Bold the numbers wherever the translation puts them. */}
                {t('Showing :from to :to of :total')
                    .split(/(:from|:total|:to)/)
                    .map((part, i) =>
                        part.startsWith(':') ? (
                            <span
                                key={i}
                                className="font-semibold text-foreground"
                            >
                                {
                                    paginator[
                                        part.slice(1) as 'from' | 'to' | 'total'
                                    ]
                                }
                            </span>
                        ) : (
                            part
                        ),
                    )}
            </p>
            <div className="flex gap-2">
                {pageLinks.map(({ url, label, icon: Icon }) =>
                    url ? (
                        <Button
                            key={label}
                            variant="outline"
                            size="icon"
                            asChild
                        >
                            {/* preserveState keeps the grid/list choice across pages. */}
                            <Link href={url} preserveState aria-label={label}>
                                <Icon />
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            key={label}
                            variant="outline"
                            size="icon"
                            disabled
                            aria-label={label}
                        >
                            <Icon />
                        </Button>
                    ),
                )}
            </div>
        </nav>
    );
}
