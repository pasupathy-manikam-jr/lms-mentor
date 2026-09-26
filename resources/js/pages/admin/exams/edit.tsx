import { Head, router, setLayoutProps } from '@inertiajs/react';
import {
    CircleDollarSign,
    CircleHelp,
    Eye,
    FlaskConical,
    FolderInput,
    ListChecks,
    Settings,
    SlidersHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
    CoursePricingFields,
    CourseSeoFields,
    CourseTextFields,
    ImageField,
} from '@/components/admin/course-form';
import {
    ExamDetailFields,
    ExamSettingsFields,
    submitExamForm,
    useExamForm,
} from '@/components/admin/exam-form';
import type {
    ExamFormOptions,
    ExamFormValues,
} from '@/components/admin/exam-form';
import {
    ExamQuestions,
    examQuestionUrls,
} from '@/components/admin/exam-questions';
import type { ExamQuestion } from '@/components/admin/exam-questions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { EXAM_STATUS_LABEL } from '@/pages/admin/exams/index';
import type { ExamStatus } from '@/pages/admin/exams/index';
import { dashboard } from '@/routes';
import { edit, index, status as examStatus } from '@/routes/admin/exams';
import { show as examShow } from '@/routes/exams';

type Tab = 'questions' | 'basic' | 'pricing' | 'settings' | 'media' | 'seo';

/** The demo's tabs; Resources and Info are still to come. */
const TABS: { value: Tab; label: string; icon: LucideIcon }[] = [
    { value: 'questions', label: 'Questions', icon: CircleHelp },
    { value: 'basic', label: 'Basic', icon: Settings },
    { value: 'pricing', label: 'Pricing', icon: CircleDollarSign },
    { value: 'settings', label: 'Settings', icon: SlidersHorizontal },
    { value: 'media', label: 'Media', icon: FolderInput },
    { value: 'seo', label: 'SEO', icon: FlaskConical },
];

/** Which tab holds each field, so a failed save shows the field with the error. */
const FIELD_TABS: Record<string, Tab> = {
    duration_hours: 'settings',
    duration_minutes: 'settings',
    pass_percentage: 'settings',
    max_attempts: 'settings',
    total_marks: 'settings',
    pricing_type: 'pricing',
    price: 'pricing',
    discount_price: 'pricing',
    expiry_type: 'pricing',
    expiry_months: 'pricing',
    thumbnail: 'media',
    meta_title: 'seo',
    meta_keywords: 'seo',
    meta_description: 'seo',
    og_title: 'seo',
    og_description: 'seo',
};

/**
 * The exam editor ("Manage Exam Contents"), following the Mentor demo: View Exam, the status, Change
 * Status, and tabs. Every form tab saves the whole exam.
 */
export default function EditExam({
    exam,
    slug,
    status,
    statuses,
    questions,
    ...options
}: ExamFormOptions & {
    exam: ExamFormValues;
    slug: string;
    status: ExamStatus;
    statuses: ExamStatus[];
    questions: ExamQuestion[];
}) {
    const { t } = useTranslation();
    const form = useExamForm(exam);
    const [tab, setTab] = useState<Tab>(() => {
        const requested = new URLSearchParams(
            typeof window === 'undefined' ? '' : window.location.search,
        ).get('tab');

        return TABS.some((item) => item.value === requested)
            ? (requested as Tab)
            : 'questions';
    });

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Exams', href: index() },
            { title: exam.title, href: edit(exam.id) },
        ],
    });

    // After a failed save, jump to the first tab with an error.
    const firstErrorTab = Object.keys(form.errors).map(
        (field) => FIELD_TABS[field] ?? 'basic',
    )[0];
    const [shownErrors, setShownErrors] = useState(form.errors);

    if (shownErrors !== form.errors) {
        setShownErrors(form.errors);

        if (firstErrorTab) {
            setTab(firstErrorTab);
        }
    }

    const save = (event: FormEvent) => {
        event.preventDefault();
        submitExamForm(form, exam.id);
    };

    const saveBar = (
        <div className="text-end">
            <Button type="submit" disabled={form.processing}>
                {form.processing && <Spinner />}
                {t('Save changes')}
            </Button>
        </div>
    );

    return (
        <>
            <Head title={`${t('Manage exam contents')} · ${exam.title}`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {t('Manage exam contents')}
                        </h1>
                        <p className="truncate text-sm text-muted-foreground">
                            {exam.title}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <Button asChild>
                            <a
                                href={examShow.url(slug)}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Eye />
                                {t('View exam')}
                            </a>
                        </Button>
                        <Badge
                            className={cn(
                                'h-9 px-4 text-sm',
                                status === 'published'
                                    ? 'bg-emerald-400 text-white dark:bg-emerald-500'
                                    : 'bg-muted text-muted-foreground',
                            )}
                        >
                            {t(EXAM_STATUS_LABEL[status])}
                        </Badge>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button>
                                    <ListChecks />
                                    {t('Change status')}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuRadioGroup
                                    value={status}
                                    onValueChange={(value) =>
                                        router.patch(
                                            examStatus.url(exam.id),
                                            { status: value },
                                            {
                                                preserveScroll: true,
                                                preserveState: true,
                                            },
                                        )
                                    }
                                >
                                    {statuses.map((value) => (
                                        <DropdownMenuRadioItem
                                            key={value}
                                            value={value}
                                        >
                                            {t(EXAM_STATUS_LABEL[value])}
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-4">
                    <div
                        role="tablist"
                        aria-orientation="vertical"
                        className="flex h-fit gap-1 overflow-x-auto rounded-2xl border bg-card py-2 text-card-foreground shadow-sm md:flex-col md:py-5"
                    >
                        {TABS.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                role="tab"
                                id={`tab-${item.value}`}
                                aria-selected={tab === item.value}
                                aria-controls={`panel-${item.value}`}
                                onClick={() => setTab(item.value)}
                                className={cn(
                                    'relative flex shrink-0 cursor-pointer items-center gap-3 px-5 py-3 text-start text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                    tab === item.value &&
                                        'bg-muted before:absolute before:inset-y-0 before:start-0 before:w-1 before:rounded-e-xl before:bg-primary',
                                )}
                            >
                                <item.icon className="size-4" />
                                {t(item.label)}
                            </button>
                        ))}
                    </div>

                    <div
                        role="tabpanel"
                        id={`panel-${tab}`}
                        aria-labelledby={`tab-${tab}`}
                        className="min-w-0 md:col-span-3"
                    >
                        {tab === 'questions' && (
                            <ExamQuestions
                                urls={examQuestionUrls(exam.id)}
                                items={questions}
                            />
                        )}

                        {tab === 'basic' && (
                            <TabForm onSubmit={save}>
                                <CourseTextFields form={form} />
                                <ExamDetailFields
                                    form={form}
                                    options={options}
                                />
                                {saveBar}
                            </TabForm>
                        )}

                        {tab === 'pricing' && (
                            <TabForm onSubmit={save}>
                                <CoursePricingFields
                                    form={form}
                                    priceLabel={t('Enter your exam price ($0)')}
                                />
                                {saveBar}
                            </TabForm>
                        )}

                        {tab === 'settings' && (
                            <TabForm onSubmit={save}>
                                <ExamSettingsFields form={form} hints />
                                {saveBar}
                            </TabForm>
                        )}

                        {tab === 'media' && (
                            <TabForm onSubmit={save}>
                                <ImageField
                                    form={form}
                                    name="thumbnail"
                                    label={t('Thumbnail')}
                                    currentUrl={exam.image_url}
                                />
                                {saveBar}
                            </TabForm>
                        )}

                        {tab === 'seo' && (
                            <TabForm onSubmit={save}>
                                <CourseSeoFields form={form} />
                                {saveBar}
                            </TabForm>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function TabForm({
    onSubmit,
    children,
}: {
    onSubmit: (event: FormEvent) => void;
    children: ReactNode;
}) {
    return (
        <Card className="p-4 sm:p-6">
            <form onSubmit={onSubmit} className="space-y-6">
                {children}
            </form>
        </Card>
    );
}
