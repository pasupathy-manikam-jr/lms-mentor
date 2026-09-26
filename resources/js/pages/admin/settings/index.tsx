import { Head, router, setLayoutProps, useForm } from '@inertiajs/react';
import { Info, Mail, Save } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Field } from '@/components/admin/course-form';
import InputError from '@/components/input-error';
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
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import settingsRoutes from '@/routes/admin/settings';

type Section = 'system' | 'storage' | 'smtp' | 'auth' | 'analytics';

const TITLES: Record<Section, string> = {
    system: 'System settings',
    storage: 'Storage settings',
    smtp: 'SMTP settings',
    auth: 'Auth settings',
    analytics: 'Analytics settings',
};

/**
 * Settings, following the Mentor demo: one page per section, each saved on its own.
 */
export default function Settings({
    section,
    values,
    mailer,
}: {
    section: Section;
    values: Record<string, string | boolean | number | null>;
    mailer: string;
}) {
    const { t } = useTranslation();

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Settings', href: settingsRoutes.show('system') },
            { title: TITLES[section], href: settingsRoutes.show(section) },
        ],
    });

    return (
        <>
            <Head title={t(TITLES[section])} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t(TITLES[section])}
                </h1>
                {section === 'storage' ? (
                    <StorageInfo values={values} />
                ) : (
                    <SettingsForm
                        key={section}
                        section={section}
                        values={values}
                        mailer={mailer}
                    />
                )}
            </div>
        </>
    );
}

function SettingsForm({
    section,
    values,
    mailer,
}: {
    section: Exclude<Section, 'storage'>;
    values: Record<string, string | boolean | number | null>;
    mailer: string;
}) {
    const { t } = useTranslation();
    const form = useForm<Record<string, string | boolean>>(
        section === 'smtp'
            ? {
                  host: String(values.host ?? ''),
                  port: String(values.port ?? '587'),
                  encryption: String(values.encryption ?? 'tls'),
                  username: String(values.username ?? ''),
                  password: '',
                  from_address: String(values.from_address ?? ''),
                  from_name: String(values.from_name ?? ''),
              }
            : Object.fromEntries(
                  Object.entries(values).map(([key, value]) => [
                      key,
                      typeof value === 'boolean' ? value : String(value ?? ''),
                  ]),
              ),
    );
    const [testing, setTesting] = useState(false);
    const [testError, setTestError] = useState<string>();
    const { data, setData, errors } = form;

    const text = (
        name: string,
        label: string,
        options: {
            required?: boolean;
            type?: string;
            placeholder?: string;
            hint?: ReactNode;
            multiline?: boolean;
        } = {},
    ) => (
        <Field
            label={t(label)}
            htmlFor={name}
            required={options.required}
            error={errors[name]}
        >
            {options.multiline ? (
                <Textarea
                    id={name}
                    rows={3}
                    value={String(data[name] ?? '')}
                    onChange={(event) => setData(name, event.target.value)}
                    placeholder={options.placeholder}
                    className="rounded-lg"
                />
            ) : (
                <Input
                    id={name}
                    type={options.type ?? 'text'}
                    value={String(data[name] ?? '')}
                    onChange={(event) => setData(name, event.target.value)}
                    placeholder={options.placeholder}
                    autoComplete="off"
                    aria-invalid={!!errors[name]}
                    className="h-10 rounded-lg"
                />
            )}
            {options.hint && (
                <p className="mt-2 text-xs text-muted-foreground">
                    {options.hint}
                </p>
            )}
        </Field>
    );

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(settingsRoutes.update.url(section), {
            preserveScroll: true,
            onSuccess: () => section === 'smtp' && setData('password', ''),
        });
    };

    return (
        <Card className="max-w-4xl p-4 sm:p-6">
            <form onSubmit={submit} className="space-y-6">
                {section === 'system' && (
                    <>
                        {text('site_name', 'Site name', { required: true })}
                        <div className="grid gap-6 md:grid-cols-2">
                            {text('contact_email', 'Contact email', {
                                type: 'email',
                                placeholder: 'hello@example.com',
                            })}
                            {text('contact_phone', 'Contact phone', {
                                placeholder: '+60 3 0000 0000',
                            })}
                        </div>
                        {text('address', 'Address', {
                            multiline: true,
                            hint: t(
                                'Shown in the site footer. Leave a field empty to hide it.',
                            ),
                        })}
                    </>
                )}

                {section === 'smtp' && (
                    <>
                        <p className="text-sm text-muted-foreground">
                            {mailer === 'smtp'
                                ? t('Emails are sent through this mail server.')
                                : t(
                                      'Emails are not being delivered yet (mailer: :mailer). Save a mail server to start sending.',
                                      { mailer },
                                  )}
                        </p>
                        <div className="grid gap-6 md:grid-cols-2">
                            {text('host', 'Mail host', {
                                required: true,
                                placeholder: 'smtp.example.com',
                            })}
                            {text('port', 'Mail port', {
                                required: true,
                                type: 'number',
                                placeholder: '587',
                            })}
                            <Field
                                label={t('Mail encryption')}
                                htmlFor="encryption"
                                required
                                error={errors.encryption}
                            >
                                <Select
                                    value={String(data.encryption)}
                                    onValueChange={(value) =>
                                        setData('encryption', value)
                                    }
                                >
                                    <SelectTrigger
                                        id="encryption"
                                        className="h-10 w-full rounded-lg"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tls">
                                            TLS (587)
                                        </SelectItem>
                                        <SelectItem value="ssl">
                                            SSL (465)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                            {text('username', 'Mail username', {
                                placeholder: 'you@example.com',
                            })}
                            {text('password', 'Mail password', {
                                type: 'password',
                                placeholder: values.has_password
                                    ? t('Saved. Leave blank to keep it.')
                                    : '',
                            })}
                            {text('from_address', 'Mail from address', {
                                required: true,
                                type: 'email',
                                placeholder: 'noreply@example.com',
                            })}
                            {text('from_name', 'Mail from name', {
                                required: true,
                            })}
                        </div>
                    </>
                )}

                {section === 'auth' && (
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="registration_open"
                            checked={Boolean(data.registration_open)}
                            onCheckedChange={(checked) =>
                                setData('registration_open', checked === true)
                            }
                        />
                        <div>
                            <Label htmlFor="registration_open">
                                {t('Allow new sign-ups')}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {t(
                                    'When off, the sign-up form refuses new accounts. Existing users can still sign in.',
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {section === 'analytics' && (
                    <div className="grid gap-6 md:grid-cols-2">
                        {text(
                            'google_analytics_id',
                            'Google Analytics measurement ID',
                            {
                                placeholder: 'G-XXXXXXXXXX',
                                hint: t(
                                    'Leave empty to turn Google Analytics off.',
                                ),
                            },
                        )}
                        {text('meta_pixel_id', 'Meta Pixel ID', {
                            placeholder: '123456789012345',
                            hint: t('Leave empty to turn the Meta Pixel off.'),
                        })}
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3">
                    {section === 'smtp' && (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={testing || mailer !== 'smtp'}
                            onClick={() =>
                                router.post(
                                    settingsRoutes.testMail.url(),
                                    {},
                                    {
                                        preserveScroll: true,
                                        onStart: () => {
                                            setTesting(true);
                                            setTestError(undefined);
                                        },
                                        onError: (errs) =>
                                            setTestError(errs.test),
                                        onFinish: () => setTesting(false),
                                    },
                                )
                            }
                        >
                            {testing ? <Spinner /> : <Mail />}
                            {t('Send test email')}
                        </Button>
                    )}
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? <Spinner /> : <Save />}
                        {t('Save changes')}
                    </Button>
                </div>
                <InputError message={testError} />
            </form>
        </Card>
    );
}

function StorageInfo({
    values,
}: {
    values: Record<string, string | boolean | number | null>;
}) {
    const { t } = useTranslation();

    return (
        <Card className="max-w-4xl gap-4 p-4 sm:p-6">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                    <dt className="text-muted-foreground">
                        {t('Storage driver')}
                    </dt>
                    <dd className="font-medium">{t('Local')}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">
                        {t('Public files are served from')}
                    </dt>
                    <dd className="font-medium break-all">
                        {String(values.public_url)}
                    </dd>
                </div>
            </dl>
            <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
                <Info className="mt-0.5 size-4 shrink-0" />
                <p>
                    {t(
                        'Uploads are kept on this server: public files (images, media library) in storage/app/public and private files (lessons, resumes, receipts) in storage/app/private. Moving to cloud storage such as Amazon S3 needs an extra package and moving the existing files, so it is set up by a developer rather than here.',
                    )}
                </p>
            </div>
        </Card>
    );
}
