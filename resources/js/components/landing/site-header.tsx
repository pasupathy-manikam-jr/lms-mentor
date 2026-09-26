import { Link, router, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useAppearance } from '@/hooks/use-appearance';
import { useInitials } from '@/hooks/use-initials';
import { accountMenuItems } from '@/lib/account-menu';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { about, home, login, logout, register } from '@/routes';
import { index as blogIndex } from '@/routes/blog';
import { index as careersIndex } from '@/routes/careers';
import { index as coursesIndex } from '@/routes/courses';
import { index as examsIndex } from '@/routes/exams';
import { index as teamIndex } from '@/routes/team';
import { index as storeIndex } from '@/routes/store';

// '/...' links are pages, '#...' links are sections of the home page, '#' marks a page that doesn't exist yet.
export const navLinks = [
    { label: 'Courses', href: coursesIndex.url() },
    { label: 'Exams', href: examsIndex.url() },
    { label: 'Store', href: storeIndex.url() },
    { label: 'About Us', href: about.url() },
    { label: 'Our Team', href: teamIndex.url() },
    { label: 'Careers', href: careersIndex.url() },
    { label: 'Blogs', href: blogIndex.url() },
];

export function Wordmark({ className }: { className?: string }) {
    const { name } = usePage().props;

    return (
        <span className={cn('flex items-center gap-2 font-bold', className)}>
            <AppLogoIcon className="size-7 fill-current text-amber-500" />
            {name}
        </span>
    );
}

export function NavLink({
    href,
    scrollTo,
    onNavigate,
    className,
    children,
}: {
    href: string;
    scrollTo?: (target: string) => void;
    onNavigate?: () => void;
    className: string;
    children: ReactNode;
}) {
    if (href.startsWith('/')) {
        return (
            <Link href={href} onClick={onNavigate} className={className}>
                {children}
            </Link>
        );
    }

    return (
        <a
            href={scrollTo || href === '#' ? href : `${home.url()}${href}`}
            onClick={(e) => {
                if (href === '#' || scrollTo) {
                    e.preventDefault();
                }

                if (href !== '#') {
                    scrollTo?.(href);
                }

                onNavigate?.();
            }}
            className={className}
        >
            {children}
        </a>
    );
}

export function ThemeToggle() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';
    const { t } = useTranslation();

    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label={
                isDark ? t('Switch to light mode') : t('Switch to dark mode')
            }
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
        >
            {isDark ? <Sun /> : <Moon />}
        </Button>
    );
}

/**
 * Signed in: the avatar menu, with the Mentor demo's items for each role. Admins get Dashboard and
 * Logout; instructors and students get their learning pages (instructors also Dashboard).
 */
export function AuthButtons() {
    const { auth } = usePage().props;
    const { t } = useTranslation();
    const getInitials = useInitials();

    if (!auth.user) {
        return (
            <>
                <Button variant="ghost" asChild>
                    <Link href={register()}>{t('Sign up')}</Link>
                </Button>
                <Button asChild>
                    <Link href={login()}>{t('Log in')}</Link>
                </Button>
            </>
        );
    }

    const items = accountMenuItems(auth.roles);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 rounded-full p-0"
                    aria-label={t('Account menu')}
                >
                    <Avatar className="size-9">
                        {auth.user.avatar && (
                            <AvatarImage src={auth.user.avatar} alt="" />
                        )}
                        <AvatarFallback className="font-semibold">
                            {getInitials(auth.user.name)}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {items.map((item) => (
                    <DropdownMenuItem key={item.label} asChild>
                        <Link href={item.href}>
                            <item.icon />
                            {t(item.label)}
                        </Link>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild>
                    <Link
                        href={logout()}
                        method="post"
                        as="button"
                        className="w-full"
                        onClick={() => router.flushAll()}
                    >
                        <LogOut />
                        {t('Logout')}
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Pass scrollTo on the home page so section links glide there; elsewhere they load the home page at that section.
 */
export function SiteHeader({
    scrollTo,
}: {
    scrollTo?: (target: string) => void;
}) {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const pendingTarget = useRef<string | null>(null);
    const { t } = useTranslation();
    const scrollToSection = (target: string) =>
        scrollTo ? scrollTo(target) : router.visit(`${home.url()}${target}`);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const authButtons = <AuthButtons />;

    return (
        <header
            className={cn(
                'fixed inset-x-0 top-0 z-40 border-b transition-all duration-300',
                scrolled
                    ? 'border-border bg-background/85 shadow-sm backdrop-blur'
                    : 'border-transparent bg-transparent',
            )}
        >
            <div
                className={cn(
                    'mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 transition-all duration-300',
                    scrolled ? 'h-14' : 'h-18',
                )}
            >
                <Link href="/" className="text-lg">
                    <Wordmark />
                </Link>

                <nav className="hidden gap-5 text-sm lg:flex">
                    {navLinks.map((link) => (
                        <NavLink
                            key={t(link.label)}
                            href={link.href}
                            scrollTo={scrollTo}
                            className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {t(link.label)}
                        </NavLink>
                    ))}
                </nav>

                <div className="flex items-center gap-2 text-sm">
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <div className="hidden items-center gap-2 sm:flex">
                        {authButtons}
                    </div>

                    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden"
                                aria-label={t('Open menu')}
                            >
                                <Menu />
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            onCloseAutoFocus={(e) => {
                                // Scroll only after the sheet has closed and released the page scroll lock.
                                if (pendingTarget.current) {
                                    e.preventDefault();
                                    scrollToSection(pendingTarget.current);
                                    pendingTarget.current = null;
                                }
                            }}
                        >
                            <SheetHeader>
                                <SheetTitle>
                                    <Wordmark />
                                </SheetTitle>
                                <SheetDescription className="sr-only">
                                    {t('Site navigation')}
                                </SheetDescription>
                            </SheetHeader>
                            <nav className="flex flex-col gap-1 px-4">
                                {navLinks.map((link) => (
                                    <NavLink
                                        key={t(link.label)}
                                        href={link.href}
                                        scrollTo={(target) => {
                                            pendingTarget.current = target;
                                        }}
                                        onNavigate={() => setMenuOpen(false)}
                                        className="rounded-md px-3 py-2 text-base hover:bg-muted"
                                    >
                                        {t(link.label)}
                                    </NavLink>
                                ))}
                            </nav>
                            <div className="mt-auto flex flex-col gap-2 p-4 sm:hidden">
                                {authButtons}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
