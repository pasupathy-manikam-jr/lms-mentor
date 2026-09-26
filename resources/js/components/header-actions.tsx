import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    BellOff,
    KeyRound,
    LogOut,
    Mail,
    PilcrowLeft,
    PilcrowRight,
    Settings,
    UserRound,
} from 'lucide-react';
import AppearanceTabs from '@/components/appearance-tabs';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    colorPresets,
    fontFamilies,
    useCustomization,
} from '@/hooks/use-customization';
import type { Customization } from '@/hooks/use-customization';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from '@/hooks/use-translation';
import { accountMenuItems } from '@/lib/account-menu';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import { readAll } from '@/routes/notifications';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';

export type AppNotification = {
    id: string;
    data: { title: string; message?: string; url?: string };
    created_at: string;
};

const timeAgo = (date: string, locale: string) => {
    const minutes = Math.round((Date.parse(date) - Date.now()) / 60_000);
    const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(minutes) < 60) {
        return format.format(minutes, 'minute');
    }

    if (Math.abs(minutes) < 1440) {
        return format.format(Math.round(minutes / 60), 'hour');
    }

    return format.format(Math.round(minutes / 1440), 'day');
};

export function NotificationsMenu() {
    const { t, locale } = useTranslation();
    const { notifications } = usePage<{ notifications: AppNotification[] }>()
        .props;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full"
                    aria-label={t('Notifications (:count unread)', {
                        count: notifications.length,
                    })}
                >
                    <Bell className="size-5" />
                    {notifications.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-amber-500" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="flex max-h-[28rem] w-80 flex-col p-0"
            >
                <div className="border-b px-4 py-3">
                    <p className="font-semibold">{t('Notifications')}</p>
                    <p className="text-xs text-muted-foreground">
                        {notifications.length > 0
                            ? t(':count unread', {
                                  count: notifications.length,
                              })
                            : t('You’re all caught up.')}
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto px-4">
                    {notifications.length > 0 ? (
                        <ul className="divide-y">
                            {notifications.map((notification) => (
                                <li key={notification.id} className="py-3">
                                    <p className="text-sm font-medium">
                                        {notification.data.url ? (
                                            <Link
                                                href={notification.data.url}
                                                className="hover:underline"
                                            >
                                                {notification.data.title}
                                            </Link>
                                        ) : (
                                            notification.data.title
                                        )}
                                    </p>
                                    {notification.data.message && (
                                        <p className="text-sm text-muted-foreground">
                                            {notification.data.message}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {timeAgo(
                                            notification.created_at,
                                            locale,
                                        )}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                            <BellOff className="size-8" aria-hidden />
                            {t('No unread notifications')}
                        </div>
                    )}
                </div>
                {notifications.length > 0 && (
                    <div className="border-t p-3">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                                router.post(
                                    readAll.url(),
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                        >
                            {t('Mark all as read')}
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function SettingsMenu() {
    const { t } = useTranslation();
    const { customization, update } = useCustomization();

    const shortcuts = [
        { label: 'Profile', href: editProfile.url(), icon: UserRound },
        {
            label: 'Password & security',
            href: editSecurity.url(),
            icon: KeyRound,
        },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label={t('Settings')}
                >
                    <Settings className="size-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="max-h-[80vh] w-80 overflow-y-auto p-0"
            >
                <div className="border-b px-4 py-3">
                    <p className="font-semibold">{t('Settings')}</p>
                    <p className="text-xs text-muted-foreground">
                        {t('Personalise how the site looks on this device.')}
                    </p>
                </div>
                <div className="space-y-5 px-4 py-4">
                    <section className="space-y-3">
                        <h3 className="text-sm font-medium">
                            {t('Appearance')}
                        </h3>
                        <AppearanceTabs />
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-sm font-medium">
                            {t('Colour preset')}
                        </h3>
                        <div
                            role="radiogroup"
                            aria-label={t('Colour preset')}
                            className="grid grid-cols-3 gap-2"
                        >
                            {colorPresets.map((preset) => {
                                const selected =
                                    customization.themeColor === preset.value;

                                return (
                                    <button
                                        key={preset.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        onClick={() =>
                                            update('themeColor', preset.value)
                                        }
                                        className={cn(
                                            'flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm hover:bg-accent',
                                            selected &&
                                                'border-primary ring-1 ring-primary',
                                        )}
                                    >
                                        <span
                                            className="size-4 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor: preset.swatch,
                                            }}
                                            aria-hidden
                                        />
                                        {t(preset.label)}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-sm font-medium">
                            {t('Font family')}
                        </h3>
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            value={customization.font}
                            onValueChange={(value) =>
                                value &&
                                update('font', value as Customization['font'])
                            }
                            className="w-full"
                        >
                            {fontFamilies.map((font) => (
                                <ToggleGroupItem
                                    key={font.value}
                                    value={font.value}
                                    className="flex-1"
                                    style={{ fontFamily: font.css }}
                                >
                                    {font.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-sm font-medium">
                            {t('Layout direction')}
                        </h3>
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            value={customization.direction}
                            onValueChange={(value) =>
                                value &&
                                update(
                                    'direction',
                                    value as Customization['direction'],
                                )
                            }
                            className="w-full"
                        >
                            <ToggleGroupItem value="ltr" className="flex-1">
                                <PilcrowRight aria-hidden />
                                {t('Left to right')}
                            </ToggleGroupItem>
                            <ToggleGroupItem value="rtl" className="flex-1">
                                <PilcrowLeft aria-hidden />
                                {t('Right to left')}
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </section>

                    <section className="space-y-1">
                        <h3 className="mb-2 text-sm font-medium">
                            {t('Account')}
                        </h3>
                        {shortcuts.map((shortcut) => (
                            <Link
                                key={shortcut.label}
                                href={shortcut.href}
                                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent"
                            >
                                <shortcut.icon
                                    className="size-4 text-muted-foreground"
                                    aria-hidden
                                />
                                {t(shortcut.label)}
                            </Link>
                        ))}
                    </section>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

const ROLE_LABEL: Record<string, string> = {
    admin: 'Admin',
    instructor: 'Instructor',
    student: 'Student',
};

/**
 * The avatar in the header, with the same content as the Mentor demo (shown as a dropdown): a
 * banner with the picture, name, role and email, and Logout.
 */
export function ProfileMenu() {
    const { t } = useTranslation();
    const { auth } = usePage().props;
    const getInitials = useInitials();
    const role = auth.roles[0] ?? 'student';

    const avatar = (size: string, text: string) => (
        <Avatar className={size}>
            {auth.user.avatar && <AvatarImage src={auth.user.avatar} alt="" />}
            <AvatarFallback className={cn('font-semibold', text)}>
                {getInitials(auth.user.name)}
            </AvatarFallback>
        </Avatar>
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative size-10 rounded-full p-0"
                    aria-label={t('Account menu')}
                >
                    {avatar('size-9', '')}
                    <span
                        className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-background bg-green-500"
                        aria-hidden
                    />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-80 overflow-hidden p-0"
            >
                <div className="h-20 bg-gradient-to-br from-muted to-muted-foreground/20" />
                <div className="-mt-9 px-5">
                    <div className="inline-flex rounded-full bg-background p-1 shadow-sm">
                        {avatar('size-16', 'text-xl')}
                    </div>
                </div>
                <div className="px-5 pt-3 pb-4">
                    <div className="flex items-start justify-between gap-3">
                        <p className="truncate text-lg font-semibold">
                            {auth.user.name}
                        </p>
                        <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                            {t(ROLE_LABEL[role] ?? role)}
                        </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                        <Mail className="size-3.5 shrink-0" aria-hidden />
                        {auth.user.email}
                    </p>
                </div>
                <div className="space-y-1 border-t p-3">
                    {accountMenuItems(auth.roles).map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent"
                        >
                            <item.icon className="size-4 text-muted-foreground" />
                            {t(item.label)}
                        </Link>
                    ))}
                    <Link
                        href={logout()}
                        method="post"
                        as="button"
                        onClick={() => router.flushAll()}
                        data-test="logout-button"
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm text-destructive hover:bg-destructive/10"
                    >
                        <LogOut className="size-4" />
                        {t('Logout')}
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Right-hand side of the app header: language, notifications, settings and the account menu.
 */
export function HeaderActions() {
    return (
        <div className="ml-auto flex items-center gap-1.5">
            <LanguageSwitcher />
            <NotificationsMenu />
            <SettingsMenu />
            <ProfileMenu />
        </div>
    );
}
