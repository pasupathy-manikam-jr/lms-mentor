import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useTranslation } from '@/hooks/use-translation';
import type { AdminNavItem } from '@/lib/admin-nav';

/**
 * Admin sidebar menu: plain links, and collapsible groups that work as an accordion. Only one group is open at a time
 * (starting with the group of the current page), and an opened group scrolls into view if it sits below the fold.
 */
export function NavMain({ items }: { items: AdminNavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { t } = useTranslation();
    const [openGroup, setOpenGroup] = useState<string | null>(
        () =>
            items.find((item) =>
                item.items?.some((link) => isCurrentUrl(link.href)),
            )?.title ?? null,
    );
    const groupRefs = useRef(new Map<string, HTMLLIElement>());
    const scrollOnOpen = useRef(false);

    useEffect(() => {
        if (!openGroup || !scrollOnOpen.current) {
            return;
        }

        scrollOnOpen.current = false;
        // Wait a frame so the sub-menu has its height before measuring.
        const frame = requestAnimationFrame(() =>
            groupRefs.current
                .get(openGroup)
                ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
        );

        return () => cancelAnimationFrame(frame);
    }, [openGroup]);

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{t('Main menu')}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) =>
                    item.items ? (
                        <Collapsible
                            key={item.title}
                            asChild
                            open={openGroup === item.title}
                            onOpenChange={(open) => {
                                scrollOnOpen.current = open;
                                setOpenGroup(open ? item.title : null);
                            }}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem
                                ref={(element) => {
                                    if (element) {
                                        groupRefs.current.set(
                                            item.title,
                                            element,
                                        );
                                    }
                                }}
                            >
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        tooltip={{ children: t(item.title) }}
                                    >
                                        <item.icon />
                                        <span>{t(item.title)}</span>
                                        <ChevronRight className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:-scale-x-100" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items.map((link) => (
                                            <SidebarMenuSubItem key={link.href}>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isCurrentUrl(
                                                        link.href,
                                                    )}
                                                >
                                                    <Link href={link.href}>
                                                        <span>
                                                            {t(link.title)}
                                                        </span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    ) : (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href!)}
                                tooltip={{ children: t(item.title) }}
                            >
                                <Link href={item.href!} prefetch>
                                    <item.icon />
                                    <span>{t(item.title)}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ),
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
