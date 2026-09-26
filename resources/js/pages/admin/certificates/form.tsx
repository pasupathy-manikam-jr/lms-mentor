import { Head, setLayoutProps, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import type { FormEvent } from 'react';
import {
    CertificateCanvas,
    MarksheetCanvas,
} from '@/components/certificates/certificate-canvas';
import type {
    Design,
    TemplateColors,
} from '@/components/certificates/certificate-canvas';
import { Field } from '@/components/admin/course-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import {
    SAMPLE_CERTIFICATE,
    SAMPLE_MARKSHEET,
} from '@/lib/certificate-samples';
import { cn } from '@/lib/utils';
import { DESIGN_LABEL, routesFor } from '@/pages/admin/certificates/index';
import type { Kind, Template } from '@/pages/admin/certificates/index';
import { dashboard } from '@/routes';

const DESIGNS: Design[] = ['classic', 'academic', 'elegant', 'modern'];

const DEFAULT_COLORS: Record<Design, TemplateColors> = {
    classic: {
        primary: '#a67c1a',
        accent: '#d8b366',
        background: '#fdfaf3',
        text: '#4a3d26',
    },
    academic: {
        primary: '#1a3a5c',
        accent: '#8ba8c0',
        background: '#f5f8fb',
        text: '#1f2937',
    },
    elegant: {
        primary: '#7a4b12',
        accent: '#e2b25c',
        background: '#fbf5e8',
        text: '#3f3222',
    },
    modern: {
        primary: '#0f766e',
        accent: '#99f6e4',
        background: '#ffffff',
        text: '#111827',
    },
};

const COLOR_LABELS: Record<keyof TemplateColors, string> = {
    primary: 'Main colour',
    accent: 'Accent colour',
    background: 'Background',
    text: 'Text',
};

/**
 * Create and edit a certificate or marksheet template, following the Mentor demo: name and type, a
 * design, colours and wording, with a live preview. The student's name, course and date are filled
 * in for each student.
 */
export default function CertificateTemplateForm({
    kind,
    template,
}: {
    kind: Kind;
    template: Template | null;
}) {
    const { t } = useTranslation();
    const routes = routesFor(kind);
    const isCertificate = kind === 'certificate';
    const form = useForm({
        name: template?.name ?? '',
        type: template?.type ?? 'course',
        design: template?.design ?? ('classic' as Design),
        colors: template?.colors ?? DEFAULT_COLORS.classic,
        content: {
            title:
                template?.content.title ??
                (isCertificate
                    ? 'Certificate of Completion'
                    : 'Academic Marksheet'),
            subtitle:
                template?.content.subtitle ??
                (isCertificate ? 'has successfully completed' : ''),
            organization: template?.content.organization ?? '',
            signatory: template?.content.signatory ?? '',
            footer:
                template?.content.footer ??
                (isCertificate ? '' : 'This is an official academic record'),
        },
    });
    const { data, setData, errors } = form;
    const heading = template
        ? isCertificate
            ? 'Edit certificate'
            : 'Edit marksheet'
        : isCertificate
          ? 'Create certificate'
          : 'Create marksheet';
    const error = (key: string) =>
        (errors as Record<string, string | undefined>)[key];

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            {
                title: isCertificate ? 'Certificates' : 'Marksheets',
                href: routes.index(),
            },
            template
                ? { title: template.name, href: routes.edit(template.id) }
                : { title: 'Create', href: routes.create() },
        ],
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (template) {
            form.put(routes.update.url(template.id), { preserveScroll: true });
        } else {
            form.post(routes.store.url());
        }
    };

    const setContent = (key: keyof typeof data.content, value: string) =>
        setData('content', { ...data.content, [key]: value });

    const textFields: {
        key: keyof typeof data.content;
        label: string;
        certificateOnly?: boolean;
        marksheetOnly?: boolean;
    }[] = [
        {
            key: 'title',
            label: isCertificate ? 'Certificate title' : 'Header text',
        },
        { key: 'subtitle', label: 'Subtitle', certificateOnly: true },
        {
            key: 'organization',
            label: isCertificate ? 'Organisation' : 'Institution name',
        },
        { key: 'signatory', label: 'Signed by', certificateOnly: true },
        { key: 'footer', label: 'Footer text', marksheetOnly: true },
    ];

    return (
        <>
            <Head title={t(heading)} />
            <form
                onSubmit={submit}
                className="flex flex-1 flex-col gap-6 p-4 md:p-6"
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t(heading)}
                    </h1>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? <Spinner /> : <Save />}
                        {t(template ? 'Save changes' : 'Create template')}
                    </Button>
                </div>

                <Card className="grid gap-6 p-4 sm:p-6 md:grid-cols-2">
                    <Field
                        label={t('Template name')}
                        htmlFor="name"
                        required
                        error={errors.name}
                    >
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            aria-invalid={!!errors.name}
                            className="h-10 rounded-lg"
                        />
                    </Field>
                    <Field
                        label={t('Template type')}
                        htmlFor="type"
                        required
                        error={errors.type}
                    >
                        <Select
                            value={data.type}
                            onValueChange={(value) =>
                                setData('type', value as 'course' | 'exam')
                            }
                            disabled={!isCertificate}
                        >
                            <SelectTrigger
                                id="type"
                                className="h-10 w-full rounded-lg"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="course">
                                    {t('Course')}
                                </SelectItem>
                                {isCertificate && (
                                    <SelectItem value="exam">
                                        {t('Exam')}
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </Field>
                </Card>

                <section className="space-y-3">
                    <h2 className="font-semibold">{t('Choose a design')}</h2>
                    <div
                        role="radiogroup"
                        aria-label={t('Design')}
                        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
                    >
                        {DESIGNS.map((design) => (
                            <button
                                key={design}
                                type="button"
                                role="radio"
                                aria-checked={data.design === design}
                                onClick={() => {
                                    setData((current) => ({
                                        ...current,
                                        design,
                                        colors: DEFAULT_COLORS[design],
                                    }));
                                }}
                                className={cn(
                                    'overflow-hidden rounded-xl border-2 bg-card text-sm font-medium transition-colors',
                                    data.design === design
                                        ? 'border-primary'
                                        : 'border-transparent hover:border-muted-foreground/30',
                                )}
                            >
                                <span className="pointer-events-none block">
                                    {isCertificate ? (
                                        <CertificateCanvas
                                            design={design}
                                            colors={DEFAULT_COLORS[design]}
                                            content={{
                                                title: 'Certificate of Completion',
                                                subtitle:
                                                    'has successfully completed',
                                                organization:
                                                    data.content.organization,
                                            }}
                                            data={SAMPLE_CERTIFICATE}
                                        />
                                    ) : (
                                        <MarksheetCanvas
                                            design={design}
                                            colors={DEFAULT_COLORS[design]}
                                            content={{
                                                title: 'Academic Marksheet',
                                            }}
                                            data={SAMPLE_MARKSHEET}
                                            className="mx-auto max-w-[55%]"
                                        />
                                    )}
                                </span>
                                <span className="block border-t py-2">
                                    {t(DESIGN_LABEL[design])}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                <div className="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
                    <div className="space-y-6">
                        <Card className="gap-4 p-4 sm:p-6">
                            <h2 className="font-semibold">{t('Colours')}</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {(
                                    Object.keys(
                                        COLOR_LABELS,
                                    ) as (keyof TemplateColors)[]
                                ).map((key) => (
                                    <label
                                        key={key}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <input
                                            type="color"
                                            value={data.colors[key]}
                                            onChange={(event) =>
                                                setData('colors', {
                                                    ...data.colors,
                                                    [key]: event.target.value,
                                                })
                                            }
                                            className="size-9 cursor-pointer rounded-md border bg-transparent p-0.5"
                                        />
                                        {t(COLOR_LABELS[key])}
                                    </label>
                                ))}
                            </div>
                        </Card>

                        <Card className="gap-5 p-4 sm:p-6">
                            <h2 className="font-semibold">
                                {t('Fill in the details')}
                            </h2>
                            {textFields
                                .filter(
                                    (field) =>
                                        !(
                                            field.certificateOnly &&
                                            !isCertificate
                                        ) &&
                                        !(field.marksheetOnly && isCertificate),
                                )
                                .map((field) => (
                                    <Field
                                        key={field.key}
                                        label={t(field.label)}
                                        htmlFor={`content-${field.key}`}
                                        required={field.key === 'title'}
                                        error={error(`content.${field.key}`)}
                                    >
                                        <Input
                                            id={`content-${field.key}`}
                                            value={
                                                data.content[field.key] ?? ''
                                            }
                                            onChange={(event) =>
                                                setContent(
                                                    field.key,
                                                    event.target.value,
                                                )
                                            }
                                            className="h-10 rounded-lg"
                                        />
                                    </Field>
                                ))}
                            <p className="text-xs text-muted-foreground">
                                {t(
                                    'The student’s name, the course and the date are filled in automatically for each student.',
                                )}
                            </p>
                        </Card>
                    </div>

                    <div className="space-y-2 lg:sticky lg:top-4">
                        <p className="text-sm text-muted-foreground">
                            {t('Live preview')}
                        </p>
                        {isCertificate ? (
                            <CertificateCanvas
                                design={data.design}
                                colors={data.colors}
                                content={data.content}
                                data={SAMPLE_CERTIFICATE}
                                className="rounded-lg border shadow-sm"
                            />
                        ) : (
                            <MarksheetCanvas
                                design={data.design}
                                colors={data.colors}
                                content={data.content}
                                data={SAMPLE_MARKSHEET}
                                className="mx-auto max-w-xl rounded-lg border shadow-sm"
                            />
                        )}
                    </div>
                </div>
            </form>
        </>
    );
}
