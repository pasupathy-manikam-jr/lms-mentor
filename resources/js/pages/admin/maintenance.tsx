import { Head, router } from '@inertiajs/react';
import { Power, RefreshCw, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import { maintenance } from '@/routes/admin';
import maintenanceRoutes from '@/routes/admin/maintenance';

/**
 * Maintenance, following the Mentor demo: maintenance mode, clearing caches and the system's state.
 */
export default function Maintenance({
    isDown,
    system,
}: {
    isDown: boolean;
    system: {
        php: string;
        laravel: string;
        environment: string;
        debug: boolean;
        queue: string;
        pending_jobs: number | null;
        failed_jobs: number;
    };
}) {
    const { t } = useTranslation();
    const [confirming, setConfirming] = useState(false);

    const rows: [string, string][] = [
        [t('PHP version'), system.php],
        [t('Laravel version'), system.laravel],
        [t('Environment'), system.environment],
        [t('Debug mode'), system.debug ? t('On') : t('Off')],
        [t('Queue'), system.queue],
        ...(system.pending_jobs !== null
            ? ([[t('Jobs waiting'), String(system.pending_jobs)]] as [
                  string,
                  string,
              ][])
            : []),
        [t('Failed jobs'), String(system.failed_jobs)],
    ];

    return (
        <>
            <Head title={t('Maintenance')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t('Maintenance')}
                </h1>

                <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
                    <Card className="gap-4 p-4 sm:p-6">
                        <CardHeader className="p-0">
                            <CardTitle className="flex items-center gap-2">
                                {t('Maintenance mode')}
                                <Badge
                                    variant={isDown ? 'destructive' : 'default'}
                                >
                                    {isDown ? t('On') : t('Off')}
                                </Badge>
                            </CardTitle>
                            <CardDescription>
                                {t(
                                    'Visitors see a “Be right back” page while you work. You keep access on this browser.',
                                )}
                            </CardDescription>
                        </CardHeader>
                        <Button
                            variant={isDown ? 'default' : 'destructive'}
                            onClick={() =>
                                isDown
                                    ? router.put(
                                          maintenanceRoutes.update.url(),
                                          {
                                              down: false,
                                          },
                                      )
                                    : setConfirming(true)
                            }
                        >
                            <Power />
                            {isDown
                                ? t('Bring the site back online')
                                : t('Turn on maintenance mode')}
                        </Button>
                    </Card>

                    <Card className="gap-4 p-4 sm:p-6">
                        <CardHeader className="p-0">
                            <CardTitle>{t('Clear caches')}</CardTitle>
                            <CardDescription>
                                {t(
                                    'Clears saved settings, routes, views and configuration. Use it if a change does not show up.',
                                )}
                            </CardDescription>
                        </CardHeader>
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.post(
                                    maintenanceRoutes.clearCache.url(),
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                        >
                            <RefreshCw />
                            {t('Clear caches')}
                        </Button>
                    </Card>

                    <Card className="gap-4 p-4 sm:p-6 lg:col-span-2">
                        <CardHeader className="p-0">
                            <CardTitle>{t('System')}</CardTitle>
                        </CardHeader>
                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                            {rows.map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex justify-between gap-4 border-b pb-2"
                                >
                                    <dt className="text-muted-foreground">
                                        {label}
                                    </dt>
                                    <dd className="font-medium">{value}</dd>
                                </div>
                            ))}
                        </dl>
                        {system.debug &&
                            system.environment === 'production' && (
                                <p className="flex items-center gap-2 text-sm text-destructive">
                                    <TriangleAlert className="size-4" />
                                    {t(
                                        'Debug mode is on in production. Turn it off (APP_DEBUG=false) so error details are not shown to visitors.',
                                    )}
                                </p>
                            )}
                    </Card>
                </div>
            </div>

            {confirming && (
                <Dialog
                    open
                    onOpenChange={(open) => !open && setConfirming(false)}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {t('Turn on maintenance mode?')}
                            </DialogTitle>
                            <DialogDescription>
                                {t(
                                    'Everyone except you will see a “Be right back” page until you bring the site back online here.',
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">{t('Cancel')}</Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                onClick={() =>
                                    router.put(maintenanceRoutes.update.url(), {
                                        down: true,
                                    })
                                }
                            >
                                {t('Turn on')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

Maintenance.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Maintenance', href: maintenance() },
    ],
};
