import { Form } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/use-translation';
import { subscribe } from '@/routes/newsletter';

export function NewsletterForm() {
    const { t } = useTranslation();

    return (
        <Form
            {...subscribe.form()}
            resetOnSuccess
            options={{ preserveScroll: true }}
            className="mx-auto mt-6 max-w-md"
        >
            {({ errors, processing }) => (
                <>
                    <div className="flex gap-2">
                        <label htmlFor="newsletter-email" className="sr-only">
                            {t('Email address')}
                        </label>
                        <Input
                            id="newsletter-email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder={t('you@example.com')}
                            aria-invalid={Boolean(errors.email)}
                        />
                        <Button type="submit" disabled={processing}>
                            {t('Subscribe')}
                        </Button>
                    </div>
                    <InputError message={errors.email} className="mt-2" />
                </>
            )}
        </Form>
    );
}
