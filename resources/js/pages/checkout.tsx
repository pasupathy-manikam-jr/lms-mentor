import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Banknote,
    CreditCard,
    Landmark,
    Lock,
    Send,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { SiteFooter } from '@/components/landing/site-footer';
import { SiteHeader } from '@/components/landing/site-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import checkout from '@/routes/checkout';

type Method = {
    key: 'stripe' | 'paypal' | 'toyyibpay' | 'offline';
    currency: string;
    amount: number;
    instructions: string | null;
};

const METHODS: Record<
    Method['key'],
    { name: string; hint: string; icon: LucideIcon }
> = {
    stripe: {
        name: 'Card',
        hint: 'Visa, Mastercard and more, through Stripe',
        icon: CreditCard,
    },
    paypal: {
        name: 'PayPal',
        hint: 'Your PayPal account or card',
        icon: Wallet,
    },
    toyyibpay: {
        name: 'FPX online banking',
        hint: 'Malaysian banks, through ToyyibPay',
        icon: Landmark,
    },
    offline: {
        name: 'Bank transfer',
        hint: 'Pay into our account and upload the receipt',
        icon: Banknote,
    },
};

const ITEM_LABEL = { course: 'Course', exam: 'Exam', product: 'Product' };

/**
 * Checkout for one course, exam or product: choose how to pay, then go to the gateway, or send a
 * bank-transfer receipt for an admin to approve.
 */
export default function Checkout({
    item,
    siteCurrency,
    methods,
    coupon,
    couponError,
}: {
    item: {
        type: 'course' | 'exam' | 'product';
        slug: string;
        title: string;
        image_url: string | null;
        price: number;
        /** After the coupon. */
        total: number;
        url: string;
    };
    siteCurrency: string;
    methods: Method[];
    coupon: { code: string; discount: number } | null;
    couponError: string | null;
}) {
    const { t, intlLocale } = useTranslation();
    const [selected, setSelected] = useState<Method | undefined>(methods[0]);
    const payForm = useForm({ method: '' });
    const offlineForm = useForm({
        paid_on: new Date().toLocaleDateString('en-CA'),
        transaction_id: '',
        proof: null as File | null,
    });
    const format = (amount: number, currency: string) =>
        new Intl.NumberFormat(intlLocale, {
            style: 'currency',
            currency,
        }).format(amount);
    const route = { type: item.type, slug: item.slug };
    const [couponCode, setCouponCode] = useState(coupon?.code ?? '');
    const isFreeWithCoupon = !!coupon && item.total === 0;

    const applyCoupon = (code: string) =>
        router.get(checkout.show.url(route), code ? { coupon: code } : {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });

    const payOnline = (method: Method) => {
        payForm.transform(() => ({
            method: method.key,
            coupon: coupon?.code ?? '',
        }));
        payForm.post(checkout.pay.url(route), { preserveScroll: true });
    };

    const sendReceipt = (event: FormEvent) => {
        event.preventDefault();
        offlineForm.transform((data) => ({
            ...data,
            coupon: coupon?.code ?? '',
        }));
        offlineForm.post(checkout.offline.url(route), { preserveScroll: true });
    };

    return (
        <>
            <Head title={t('Checkout')} />
            <div className="min-h-screen bg-background pt-18 text-foreground">
                <SiteHeader />

                <main className="mx-auto grid max-w-5xl items-start gap-6 px-4 py-12 lg:grid-cols-[1fr_22rem]">
                    <div className="space-y-6">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {t('Checkout')}
                        </h1>

                        {isFreeWithCoupon ? (
                            <Card>
                                <CardContent className="space-y-4">
                                    <p>
                                        {t(
                                            'Your coupon covers the full price.',
                                        )}
                                    </p>
                                    <Button
                                        size="lg"
                                        className="w-full"
                                        asChild
                                    >
                                        <Link
                                            href={checkout.free.url(route)}
                                            method="post"
                                            data={{ coupon: coupon.code }}
                                            as="button"
                                        >
                                            {t('Get it for free')}
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : methods.length === 0 ? (
                            <Card>
                                <CardContent>
                                    {t(
                                        'Payments are not open yet. Please check back soon or contact us.',
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {t('How would you like to pay?')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div
                                        role="radiogroup"
                                        aria-label={t('Payment method')}
                                        className="grid gap-3"
                                    >
                                        {methods.map((method) => {
                                            const info = METHODS[method.key];
                                            const isSelected =
                                                selected?.key === method.key;

                                            return (
                                                <button
                                                    key={method.key}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={isSelected}
                                                    onClick={() =>
                                                        setSelected(method)
                                                    }
                                                    className={cn(
                                                        'flex items-center gap-3 rounded-xl border p-4 text-start transition-colors hover:bg-muted/50',
                                                        isSelected &&
                                                            'border-primary ring-1 ring-primary',
                                                    )}
                                                >
                                                    <info.icon className="size-5 shrink-0 text-muted-foreground" />
                                                    <span className="flex-1">
                                                        <span className="block font-medium">
                                                            {t(info.name)}
                                                        </span>
                                                        <span className="block text-sm text-muted-foreground">
                                                            {t(info.hint)}
                                                        </span>
                                                    </span>
                                                    <span className="font-semibold tabular-nums">
                                                        {format(
                                                            method.amount,
                                                            method.currency,
                                                        )}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <InputError
                                        message={payForm.errors.method}
                                    />

                                    {selected && selected.key !== 'offline' && (
                                        <Button
                                            size="lg"
                                            className="w-full"
                                            disabled={payForm.processing}
                                            onClick={() => payOnline(selected)}
                                        >
                                            {payForm.processing ? (
                                                <Spinner />
                                            ) : (
                                                <Lock />
                                            )}
                                            {t('Pay :amount', {
                                                amount: format(
                                                    selected.amount,
                                                    selected.currency,
                                                ),
                                            })}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {!isFreeWithCoupon && selected?.key === 'offline' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('Bank transfer')}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="rounded-lg bg-muted p-4 text-sm whitespace-pre-line">
                                        {selected.instructions}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {t(
                                            'Transfer :amount, then tell us when you paid and upload the receipt. We give you access once we have checked it.',
                                            {
                                                amount: format(
                                                    selected.amount,
                                                    selected.currency,
                                                ),
                                            },
                                        )}
                                    </p>
                                    <form
                                        onSubmit={sendReceipt}
                                        className="space-y-4"
                                    >
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="paid_on">
                                                    {t('Payment date')} *
                                                </Label>
                                                <Input
                                                    id="paid_on"
                                                    type="date"
                                                    value={
                                                        offlineForm.data.paid_on
                                                    }
                                                    onChange={(event) =>
                                                        offlineForm.setData(
                                                            'paid_on',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        offlineForm.errors
                                                            .paid_on
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="transaction_id">
                                                    {t('Transfer reference')}
                                                </Label>
                                                <Input
                                                    id="transaction_id"
                                                    value={
                                                        offlineForm.data
                                                            .transaction_id
                                                    }
                                                    onChange={(event) =>
                                                        offlineForm.setData(
                                                            'transaction_id',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        offlineForm.errors
                                                            .transaction_id
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="proof">
                                                {t('Receipt')} *
                                            </Label>
                                            <Input
                                                id="proof"
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                                onChange={(event) =>
                                                    offlineForm.setData(
                                                        'proof',
                                                        event.target
                                                            .files?.[0] ?? null,
                                                    )
                                                }
                                                className="cursor-pointer"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                {t(
                                                    'A PDF or photo of the receipt, up to 5 MB.',
                                                )}
                                            </p>
                                            <InputError
                                                message={
                                                    offlineForm.errors.proof
                                                }
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full"
                                            disabled={offlineForm.processing}
                                        >
                                            {offlineForm.processing ? (
                                                <Spinner />
                                            ) : (
                                                <Send />
                                            )}
                                            {t('Send receipt')}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <Card className="lg:sticky lg:top-24">
                        <CardHeader>
                            <CardTitle>{t('Order summary')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-3">
                                {item.image_url && (
                                    <img
                                        src={item.image_url}
                                        alt=""
                                        className="size-16 shrink-0 rounded-lg object-cover"
                                    />
                                )}
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">
                                        {t(ITEM_LABEL[item.type])}
                                    </p>
                                    <Link
                                        href={item.url}
                                        className="font-medium hover:underline"
                                    >
                                        {item.title}
                                    </Link>
                                </div>
                            </div>
                            <Separator />
                            <form
                                className="space-y-2"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    applyCoupon(couponCode.trim());
                                }}
                            >
                                <Label htmlFor="coupon">
                                    {t('Coupon code')}
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="coupon"
                                        value={couponCode}
                                        onChange={(event) =>
                                            setCouponCode(event.target.value)
                                        }
                                        className="uppercase"
                                        autoComplete="off"
                                    />
                                    {coupon ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setCouponCode('');
                                                applyCoupon('');
                                            }}
                                        >
                                            {t('Remove')}
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            variant="outline"
                                            disabled={!couponCode.trim()}
                                        >
                                            {t('Apply')}
                                        </Button>
                                    )}
                                </div>
                                <InputError
                                    message={couponError ?? undefined}
                                />
                            </form>
                            <Separator />
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">
                                        {t('Price')}
                                    </dt>
                                    <dd className="tabular-nums">
                                        {format(item.price, siteCurrency)}
                                    </dd>
                                </div>
                                {coupon && (
                                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                                        <dt>
                                            {t('Coupon :code', {
                                                code: coupon.code,
                                            })}
                                        </dt>
                                        <dd className="tabular-nums">
                                            −
                                            {format(
                                                coupon.discount,
                                                siteCurrency,
                                            )}
                                        </dd>
                                    </div>
                                )}
                                {selected &&
                                    selected.currency !== siteCurrency && (
                                        <div className="flex justify-between">
                                            <dt className="text-muted-foreground">
                                                {t('Charged in :currency', {
                                                    currency: selected.currency,
                                                })}
                                            </dt>
                                            <dd className="tabular-nums">
                                                {format(
                                                    selected.amount,
                                                    selected.currency,
                                                )}
                                            </dd>
                                        </div>
                                    )}
                                <div className="flex justify-between text-base font-semibold">
                                    <dt>{t('Total')}</dt>
                                    <dd className="tabular-nums">
                                        {selected && !isFreeWithCoupon
                                            ? format(
                                                  selected.amount,
                                                  selected.currency,
                                              )
                                            : format(item.total, siteCurrency)}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>
                </main>

                <SiteFooter />
            </div>
        </>
    );
}
