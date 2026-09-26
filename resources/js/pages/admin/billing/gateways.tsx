import { Head, useForm } from '@inertiajs/react';
import { Banknote, CreditCard, Landmark, Save, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Field } from '@/components/admin/course-form';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { gateways as gatewaysRoute } from '@/routes/admin/billing';
import { update } from '@/routes/admin/billing/gateways';

type Gateway = {
    id: number;
    key: 'stripe' | 'paypal' | 'toyyibpay' | 'offline';
    enabled: boolean;
    test_mode: boolean;
    currency: string;
    exchange_rate: string | null;
    instructions: string | null;
    fields: string[];
    saved: Record<string, boolean>;
    webhook_url: string | null;
};

export const GATEWAY_NAMES: Record<string, string> = {
    stripe: 'Stripe',
    paypal: 'PayPal',
    toyyibpay: 'ToyyibPay',
    offline: 'Offline (bank transfer)',
};

const ICONS: Record<Gateway['key'], LucideIcon> = {
    stripe: CreditCard,
    paypal: Wallet,
    toyyibpay: Landmark,
    offline: Banknote,
};

const FIELD_LABELS: Record<string, string> = {
    publishable_key: 'Publishable key',
    secret_key: 'Secret key',
    webhook_secret: 'Webhook signing secret',
    client_id: 'Client ID',
    client_secret: 'Client secret',
    category_code: 'Category code',
};

/**
 * Billings → Configuration, following the demo's Payment Gateways page: the methods on the left, the
 * chosen method's settings on the right.
 */
export default function Gateways({
    gateways,
    currencies,
    siteCurrency,
}: {
    gateways: Gateway[];
    currencies: string[];
    siteCurrency: string;
}) {
    const { t } = useTranslation();
    const [selectedId, setSelectedId] = useState(gateways[0]?.id);
    const selected = gateways.find((g) => g.id === selectedId) ?? gateways[0];

    return (
        <>
            <Head title={t('Payment gateways')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t('Payment gateways')}
                </h1>
                <p className="-mt-3 text-sm text-muted-foreground">
                    {t(
                        'Enabled methods will be offered at checkout once online checkout is added.',
                    )}
                </p>

                <div className="grid items-start gap-5 md:grid-cols-[18rem_1fr]">
                    <Card className="gap-1 py-3">
                        {gateways.map((gateway) => {
                            const Icon = ICONS[gateway.key];

                            return (
                                <button
                                    key={gateway.id}
                                    type="button"
                                    onClick={() => setSelectedId(gateway.id)}
                                    aria-current={gateway.id === selected.id}
                                    className={cn(
                                        'relative flex items-center gap-3 px-5 py-3 text-start text-sm font-medium transition-colors hover:bg-muted',
                                        gateway.id === selected.id &&
                                            'bg-muted before:absolute before:inset-y-0 before:start-0 before:w-1 before:rounded-e-xl before:bg-primary',
                                    )}
                                >
                                    <Icon className="size-4 text-muted-foreground" />
                                    <span className="flex-1">
                                        {t(GATEWAY_NAMES[gateway.key])}
                                    </span>
                                    {gateway.enabled && (
                                        <Badge>{t('Enabled')}</Badge>
                                    )}
                                </button>
                            );
                        })}
                    </Card>

                    <GatewayForm
                        key={selected.id}
                        gateway={selected}
                        currencies={currencies}
                        siteCurrency={siteCurrency}
                    />
                </div>
            </div>
        </>
    );
}

Gateways.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Payment gateways', href: gatewaysRoute() },
    ],
};

function GatewayForm({
    gateway,
    currencies,
    siteCurrency,
}: {
    gateway: Gateway;
    currencies: string[];
    siteCurrency: string;
}) {
    const { t, intlLocale } = useTranslation();
    const form = useForm({
        enabled: gateway.enabled,
        test_mode: gateway.test_mode,
        currency: gateway.currency,
        exchange_rate: gateway.exchange_rate
            ? String(Number(gateway.exchange_rate))
            : '',
        instructions: gateway.instructions ?? '',
        credentials: {} as Record<string, string>,
    });
    const { data, setData, errors } = form;
    const currencyName = new Intl.DisplayNames([intlLocale], {
        type: 'currency',
    });
    const isOffline = gateway.key === 'offline';
    const allowedCurrencies =
        gateway.key === 'toyyibpay' ? ['MYR'] : currencies;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(update.url(gateway.id), {
            preserveScroll: true,
            onSuccess: () => setData('credentials', {}),
        });
    };

    const credentialGroup = (mode: 'sandbox' | 'live') => {
        const isActive = (mode === 'sandbox') === data.test_mode;
        const fields = gateway.fields.filter((f) => f.startsWith(`${mode}_`));

        return (
            <section
                className={cn('space-y-4', !isActive && 'opacity-60')}
                aria-label={t(
                    mode === 'sandbox'
                        ? 'Sandbox credentials'
                        : 'Live credentials',
                )}
            >
                <h3 className="font-semibold">
                    {t(
                        mode === 'sandbox'
                            ? 'Sandbox credentials'
                            : 'Live credentials',
                    )}
                </h3>
                {fields.map((field) => {
                    const name = field.replace(`${mode}_`, '');

                    return (
                        <Field
                            key={field}
                            label={t(FIELD_LABELS[name] ?? name)}
                            htmlFor={field}
                            error={errors[`credentials.${field}` as never]}
                        >
                            <Input
                                id={field}
                                type={
                                    name === 'publishable_key' ||
                                    name === 'client_id' ||
                                    name === 'category_code'
                                        ? 'text'
                                        : 'password'
                                }
                                autoComplete="off"
                                value={data.credentials[field] ?? ''}
                                onChange={(event) =>
                                    setData('credentials', {
                                        ...data.credentials,
                                        [field]: event.target.value,
                                    })
                                }
                                placeholder={
                                    gateway.saved[field]
                                        ? t('Saved. Leave blank to keep it.')
                                        : t('Not set')
                                }
                                className="h-10 rounded-lg font-mono"
                            />
                        </Field>
                    );
                })}
            </section>
        );
    };

    return (
        <Card className="p-4 sm:p-6">
            <form onSubmit={submit} className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold">
                        {t(':name settings', {
                            name: t(GATEWAY_NAMES[gateway.key]),
                        })}
                    </h2>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="enabled"
                            checked={data.enabled}
                            onCheckedChange={(checked) =>
                                setData('enabled', checked === true)
                            }
                        />
                        <Label htmlFor="enabled">{t('Enabled')}</Label>
                    </div>
                </div>
                <InputError message={errors.enabled} />

                <div className="grid gap-6 md:grid-cols-2">
                    <Field
                        label={t('Currency')}
                        htmlFor="currency"
                        required
                        error={errors.currency}
                    >
                        <Select
                            value={data.currency}
                            onValueChange={(value) =>
                                setData('currency', value)
                            }
                        >
                            <SelectTrigger
                                id="currency"
                                className="h-10 w-full rounded-lg"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {allowedCurrencies.map((code) => (
                                    <SelectItem key={code} value={code}>
                                        {currencyName.of(code)} ({code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    {!isOffline && (
                        <div>
                            <p className="mb-2 text-sm font-medium">
                                {t('Test mode')}
                            </p>
                            <div className="flex h-10 items-center gap-2">
                                <Checkbox
                                    id="test_mode"
                                    checked={data.test_mode}
                                    onCheckedChange={(checked) =>
                                        setData('test_mode', checked === true)
                                    }
                                />
                                <Label
                                    htmlFor="test_mode"
                                    className="font-normal text-muted-foreground"
                                >
                                    {data.test_mode
                                        ? t('Using the sandbox environment')
                                        : t('Taking real payments')}
                                </Label>
                            </div>
                        </div>
                    )}
                </div>

                {data.currency !== siteCurrency && (
                    <Field
                        label={t('Exchange rate')}
                        htmlFor="exchange_rate"
                        required
                        error={errors.exchange_rate}
                    >
                        <div className="flex items-center gap-2 text-sm">
                            <span className="shrink-0 font-medium">
                                1 {siteCurrency} =
                            </span>
                            <Input
                                id="exchange_rate"
                                type="number"
                                min={0}
                                step="0.0001"
                                value={data.exchange_rate}
                                onChange={(event) =>
                                    setData('exchange_rate', event.target.value)
                                }
                                aria-invalid={!!errors.exchange_rate}
                                className="h-10 max-w-40 rounded-lg"
                            />
                            <span className="shrink-0 font-medium">
                                {data.currency}
                            </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            {t(
                                'Prices are set in :site. Customers paying with this method are charged the converted amount. Update the rate when it changes.',
                                { site: siteCurrency },
                            )}
                        </p>
                    </Field>
                )}

                {gateway.webhook_url && (
                    <div className="rounded-lg border bg-muted/50 p-4 text-sm">
                        <p className="font-medium">{t('Webhook URL')}</p>
                        <p className="mt-1 text-muted-foreground">
                            {gateway.key === 'stripe'
                                ? t(
                                      'In Stripe, add this endpoint for the checkout.session.completed and checkout.session.async_payment_succeeded events, then paste its signing secret below.',
                                  )
                                : t(
                                      'In PayPal, add this webhook for the Checkout order approved and Payment capture completed events.',
                                  )}
                        </p>
                        <code className="mt-2 block rounded bg-background px-2 py-1 font-mono text-xs break-all">
                            {gateway.webhook_url}
                        </code>
                    </div>
                )}

                {isOffline ? (
                    <Field
                        label={t('Payment instructions')}
                        htmlFor="instructions"
                        required={data.enabled}
                        error={errors.instructions}
                    >
                        <Textarea
                            id="instructions"
                            rows={6}
                            value={data.instructions}
                            onChange={(event) =>
                                setData('instructions', event.target.value)
                            }
                            placeholder={t(
                                'Bank name, account name and number, and what to write as the payment reference',
                            )}
                            className="rounded-lg"
                        />
                        <p className="mt-2 text-xs text-muted-foreground">
                            {t(
                                'Shown to customers who choose to pay by bank transfer. They then upload a proof of payment for you to approve.',
                            )}
                        </p>
                    </Field>
                ) : (
                    <>
                        {credentialGroup('sandbox')}
                        <Separator />
                        {credentialGroup('live')}
                    </>
                )}

                <div className="text-end">
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? <Spinner /> : <Save />}
                        {t('Save changes')}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
