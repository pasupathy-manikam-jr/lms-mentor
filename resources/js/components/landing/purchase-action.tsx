import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { register } from '@/routes';
import checkout from '@/routes/checkout';

export type Ownership = 'owned' | 'pending' | null;

/**
 * The buy button on course, exam and product pages: sign up (guests), get it free, go to checkout, a
 * notice while an offline payment awaits approval, or `owned` once the item is theirs.
 */
export function PurchaseAction({
    type,
    slug,
    price,
    isSignedIn,
    ownership,
    freeLabel,
    buyLabel,
    owned,
}: {
    type: 'course' | 'exam' | 'product';
    slug: string;
    price: string | number;
    isSignedIn: boolean;
    ownership: Ownership;
    freeLabel: string;
    buyLabel: string;
    owned: ReactNode;
}) {
    const { t } = useTranslation();
    const isFree = Number(price) === 0;

    if (!isSignedIn) {
        return (
            <Button className="w-full" asChild>
                <Link href={register()}>{isFree ? freeLabel : buyLabel}</Link>
            </Button>
        );
    }

    if (ownership === 'owned') {
        return owned;
    }

    if (ownership === 'pending') {
        return (
            <div className="space-y-2">
                <Button className="w-full" disabled>
                    {t('Payment awaiting approval')}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                    {t(
                        'We will give you access as soon as we have checked your bank transfer.',
                    )}
                </p>
            </div>
        );
    }

    return isFree ? (
        <Button className="w-full" asChild>
            <Link
                href={checkout.free({ type, slug })}
                method="post"
                as="button"
            >
                {freeLabel}
            </Link>
        </Button>
    ) : (
        <Button className="w-full" asChild>
            <Link href={checkout.show({ type, slug })}>{buyLabel}</Link>
        </Button>
    );
}
