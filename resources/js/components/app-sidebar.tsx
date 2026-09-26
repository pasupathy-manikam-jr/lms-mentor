import { Link, usePage } from '@inertiajs/react';
import { Globe } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { adminNav, instructorNav, memberNav } from '@/lib/admin-nav';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCustomization } from '@/hooks/use-customization';
import { dashboard, home } from '@/routes';
import type { NavItem } from '@/types';

const footerNavItems: NavItem[] = [
    {
        title: 'View site',
        href: home(),
        icon: Globe,
    },
];

export function AppSidebar() {
    const { customization } = useCustomization();
    const { auth } = usePage().props;
    const isAdmin = auth.roles.includes('admin');

    return (
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
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain
                    items={
                        isAdmin
                            ? adminNav
                            : auth.roles.includes('instructor')
                              ? instructorNav
                              : memberNav
                    }
                />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
