import { Head, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import payouts from '@/routes/instructor/payouts';

/**
 * Billings → Settings for instructors: where their withdrawals are paid.
 */
export default function PayoutSettings({
    payoutDetails,
}: {
    payoutDetails: string | null;
}) {
    const { t } = useTranslation();
    const form = useForm({ payout_details: payoutDetails ?? '' });

    return (
        <>
            <Head title={t('Payout settings')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t('Payout settings')}
                </h1>
                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>{t('Payout details')}</CardTitle>
                        <CardDescription>
                            {t(
                                'Where we send your withdrawals, e.g. bank name, account name and number, or your PayPal email.',
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="space-y-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                form.put(payouts.settings.update.url(), {
                                    preserveScroll: true,
                                });
                            }}
                        >
                            <div className="space-y-2">
                                <Label
                                    htmlFor="payout_details"
                                    className="sr-only"
                                >
                                    {t('Payout details')}
                                </Label>
                                <Textarea
                                    id="payout_details"
                                    rows={5}
                                    value={form.data.payout_details}
                                    onChange={(event) =>
                                        form.setData(
                                            'payout_details',
                                            event.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={form.errors.payout_details}
                                />
                            </div>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? <Spinner /> : <Save />}
                                {t('Save changes')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

PayoutSettings.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Payout settings', href: payouts.settings() },
    ],
};
