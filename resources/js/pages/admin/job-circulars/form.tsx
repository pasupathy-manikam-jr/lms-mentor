import { Head, setLayoutProps, useForm } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    CircleDollarSign,
    FileText,
    Save,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { Field } from '@/components/admin/course-form';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { TagInput } from '@/components/admin/tag-input';
import { sentenceCase } from '@/components/landing/job-meta';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { useTranslation } from '@/hooks/use-translation';
import { JOB_STATUS_LABEL } from '@/pages/admin/job-circulars/index';
import type { JobStatus } from '@/pages/admin/job-circulars/index';
import { dashboard } from '@/routes';
import {
    create,
    edit,
    index,
    store,
    update,
} from '@/routes/admin/job-circulars';

type Job = {
    id: number;
    title: string;
    slug: string;
    status: JobStatus;
    description: string;
    apply_email: string;
    job_type: string;
    work_type: string;
    experience_level: string;
    positions: number;
    location: string;
    deadline: string;
    skills: string[];
    negotiable: boolean;
    currency: string;
    salary_min: number | null;
    salary_max: number | null;
};

type Options = {
    jobTypes: string[];
    workTypes: string[];
    experienceLevels: string[];
    statuses: JobStatus[];
    currencies: string[];
};

/**
 * Create Circular and Edit Job, following the Mentor demo: Basic Information, Job Details and Salary
 * Information.
 */
export default function JobCircularForm({
    job,
    ...options
}: Options & { job: Job | null }) {
    const { t, intlLocale } = useTranslation();
    const form = useForm({
        title: job?.title ?? '',
        slug: job?.slug ?? '',
        description: job?.description ?? '',
        status: job?.status ?? ('draft' as JobStatus),
        apply_email: job?.apply_email ?? '',
        job_type: job?.job_type ?? 'full-time',
        work_type: job?.work_type ?? 'on-site',
        experience_level: job?.experience_level ?? 'mid',
        positions: String(job?.positions ?? 1),
        location: job?.location ?? '',
        deadline: job?.deadline ?? '',
        skills: job?.skills ?? [],
        negotiable: job?.negotiable ?? false,
        currency: job?.currency ?? 'INR',
        salary_min: job?.salary_min?.toString() ?? '',
        salary_max: job?.salary_max?.toString() ?? '',
    });
    const { data, setData, errors } = form;
    const heading = job ? 'Edit job' : 'Create circular';
    const currencyName = new Intl.DisplayNames([intlLocale], {
        type: 'currency',
    });

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Job circulars', href: index() },
            job
                ? { title: job.title, href: edit(job.id) }
                : { title: 'Create circular', href: create() },
        ],
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (job) {
            form.put(update.url(job.id), { preserveScroll: true });
        } else {
            form.post(store.url());
        }
    };

    const choice = (
        name: 'job_type' | 'work_type' | 'experience_level' | 'status',
        label: string,
        values: string[],
        text: (value: string) => string,
    ) => (
        <Field label={label} htmlFor={name} required error={errors[name]}>
            <Select
                value={data[name]}
                onValueChange={(value) =>
                    setData(name, value as (typeof data)[typeof name])
                }
            >
                <SelectTrigger id={name} className="h-10 w-full rounded-lg">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {values.map((value) => (
                        <SelectItem key={value} value={value}>
                            {text(value)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </Field>
    );

    return (
        <>
            <Head title={t(heading)} />
            <form
                onSubmit={submit}
                className="flex flex-1 flex-col gap-6 p-4 md:p-6"
            >
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t(heading)}
                </h1>

                <Section
                    icon={<FileText className="size-5" />}
                    title={t('Basic information')}
                    description={t(
                        'Provide the essential details about the job position',
                    )}
                >
                    <div className="grid gap-6 md:grid-cols-2">
                        <Field
                            label={t('Job title')}
                            htmlFor="title"
                            required
                            error={errors.title}
                        >
                            <Input
                                id="title"
                                value={data.title}
                                onChange={(event) =>
                                    setData('title', event.target.value)
                                }
                                placeholder={t(
                                    'e.g. Ayurveda Course Instructor',
                                )}
                                aria-invalid={!!errors.title}
                                className="h-10 rounded-lg"
                            />
                        </Field>
                        <Field
                            label={t('URL slug')}
                            htmlFor="slug"
                            error={errors.slug}
                        >
                            <Input
                                id="slug"
                                value={data.slug}
                                onChange={(event) =>
                                    setData('slug', event.target.value)
                                }
                                placeholder={t('Made from the title')}
                                aria-invalid={!!errors.slug}
                                className="h-10 rounded-lg"
                            />
                        </Field>
                    </div>
                    <Field
                        label={t('Job description')}
                        htmlFor="description"
                        required
                        error={errors.description}
                    >
                        <RichTextEditor
                            id="description"
                            value={data.description}
                            onChange={(html) => setData('description', html)}
                            placeholder={t(
                                'Describe the role, what the person will do and what makes it worthwhile…',
                            )}
                            invalid={!!errors.description}
                        />
                    </Field>
                    <div className="grid gap-6 md:grid-cols-2">
                        {choice('status', t('Status'), options.statuses, (v) =>
                            t(JOB_STATUS_LABEL[v as JobStatus]),
                        )}
                        <Field
                            label={t('Contact email')}
                            htmlFor="apply_email"
                            required
                            error={errors.apply_email}
                        >
                            <Input
                                id="apply_email"
                                type="email"
                                value={data.apply_email}
                                onChange={(event) =>
                                    setData('apply_email', event.target.value)
                                }
                                placeholder="careers@example.com"
                                aria-invalid={!!errors.apply_email}
                                className="h-10 rounded-lg"
                            />
                        </Field>
                    </div>
                </Section>

                <Section
                    icon={<BriefcaseBusiness className="size-5" />}
                    title={t('Job details')}
                    description={t(
                        'Specify the job type, location and experience required',
                    )}
                >
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {choice(
                            'job_type',
                            t('Job type'),
                            options.jobTypes,
                            (v) => t(sentenceCase(v)),
                        )}
                        {choice(
                            'work_type',
                            t('Work type'),
                            options.workTypes,
                            (v) => t(sentenceCase(v)),
                        )}
                        {choice(
                            'experience_level',
                            t('Experience level'),
                            options.experienceLevels,
                            (v) => t(sentenceCase(`${v} level`)),
                        )}
                        <Field
                            label={t('Positions available')}
                            htmlFor="positions"
                            required
                            error={errors.positions}
                        >
                            <Input
                                id="positions"
                                type="number"
                                min={1}
                                value={data.positions}
                                onChange={(event) =>
                                    setData('positions', event.target.value)
                                }
                                aria-invalid={!!errors.positions}
                                className="h-10 rounded-lg"
                            />
                        </Field>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Field
                            label={t('Location')}
                            htmlFor="location"
                            required
                            error={errors.location}
                        >
                            <Input
                                id="location"
                                value={data.location}
                                onChange={(event) =>
                                    setData('location', event.target.value)
                                }
                                placeholder={t('e.g. Kuala Lumpur, Malaysia')}
                                aria-invalid={!!errors.location}
                                className="h-10 rounded-lg"
                            />
                        </Field>
                        <Field
                            label={t('Application deadline')}
                            htmlFor="deadline"
                            required
                            error={errors.deadline}
                        >
                            <Input
                                id="deadline"
                                type="date"
                                value={data.deadline}
                                onChange={(event) =>
                                    setData('deadline', event.target.value)
                                }
                                aria-invalid={!!errors.deadline}
                                className="h-10 rounded-lg"
                            />
                        </Field>
                    </div>
                    <Field
                        label={t('Skills required')}
                        htmlFor="skills"
                        error={
                            errors.skills ??
                            Object.entries(errors).find(([key]) =>
                                key.startsWith('skills.'),
                            )?.[1]
                        }
                    >
                        <TagInput
                            id="skills"
                            value={data.skills}
                            onChange={(skills) => setData('skills', skills)}
                            placeholder={t('Type a skill and press Enter')}
                        />
                    </Field>
                </Section>

                <Section
                    icon={<CircleDollarSign className="size-5" />}
                    title={t('Salary information')}
                    description={t(
                        'Set the monthly pay range for this position',
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="negotiable"
                            checked={data.negotiable}
                            onCheckedChange={(checked) =>
                                setData('negotiable', checked === true)
                            }
                        />
                        <Label htmlFor="negotiable">
                            {t('Salary is negotiable')}
                        </Label>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
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
                                    {options.currencies.map((code) => (
                                        <SelectItem key={code} value={code}>
                                            {currencyName.of(code)} ({code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        {(['salary_min', 'salary_max'] as const).map((name) => (
                            <Field
                                key={name}
                                label={t(
                                    name === 'salary_min'
                                        ? 'Minimum salary'
                                        : 'Maximum salary',
                                )}
                                htmlFor={name}
                                required={!data.negotiable}
                                error={errors[name]}
                            >
                                <Input
                                    id={name}
                                    type="number"
                                    min={0}
                                    disabled={data.negotiable}
                                    value={data.negotiable ? '' : data[name]}
                                    onChange={(event) =>
                                        setData(name, event.target.value)
                                    }
                                    aria-invalid={!!errors[name]}
                                    className="h-10 rounded-lg"
                                />
                            </Field>
                        ))}
                    </div>
                </Section>

                <div className="text-end">
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? <Spinner /> : <Save />}
                        {t(job ? 'Save changes' : 'Create circular')}
                    </Button>
                </div>
            </form>
        </>
    );
}

function Section({
    icon,
    title,
    description,
    children,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <Card className="gap-6 p-4 sm:p-6">
            <CardHeader className="p-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                    {icon}
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            {children}
        </Card>
    );
}
