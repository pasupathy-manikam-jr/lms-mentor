import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import {
    BookText,
    ChevronDown,
    CircleDollarSign,
    Eye,
    FilePenLine,
    FlaskConical,
    FolderInput,
    Play,
    Settings,
    TvMinimalPlay,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
    CourseDetailFields,
    CourseDripField,
    CourseMediaTab,
    CourseSeoFields,
    CoursePricingFields,
    CourseTextFields,
    submitCourseForm,
    useCourseForm,
} from '@/components/admin/course-form';
import type {
    CourseFormOptions,
    CourseFormValues,
} from '@/components/admin/course-form';
import { CourseCurriculum } from '@/components/admin/course-curriculum';
import type { CurriculumSection } from '@/components/admin/course-curriculum';
import { CourseInfo } from '@/components/admin/course-info';
import type { CourseInfoLists } from '@/components/admin/course-info';
import { CourseLiveClasses } from '@/components/admin/course-live-classes';
import type { LiveClassItem } from '@/components/admin/course-live-classes';
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
import { dashboard } from '@/routes';
import { edit, index, status as courseStatus } from '@/routes/admin/courses';
import { show as courseShow, learn } from '@/routes/courses';

type CourseStatus = 'approved' | 'upcoming' | 'pending' | 'private' | 'draft';

type EditCourseProps = CourseFormOptions & {
    course: CourseFormValues;
    slug: string;
    status: CourseStatus;
    statuses: CourseStatus[];
    sections: CurriculumSection[];
    liveClasses: LiveClassItem[];
    info: CourseInfoLists;
};

type Tab =
    | 'curriculum'
    | 'live-class'
    | 'basic'
    | 'pricing'
    | 'info'
    | 'media'
    | 'seo';

const TABS: { value: Tab; label: string; icon: LucideIcon }[] = [
    { value: 'curriculum', label: 'Curriculum', icon: FilePenLine },
    { value: 'live-class', label: 'Live class', icon: TvMinimalPlay },
    { value: 'basic', label: 'Basic', icon: Settings },
    { value: 'pricing', label: 'Pricing', icon: CircleDollarSign },
    { value: 'info', label: 'Info', icon: BookText },
    { value: 'media', label: 'Media', icon: FolderInput },
    { value: 'seo', label: 'SEO', icon: FlaskConical },
];

/** Which tab holds each form field, so a failed save can show the field with the error. */
const FIELD_TABS: Record<string, Tab> = {
    pricing_type: 'pricing',
    price: 'pricing',
    discount_price: 'pricing',
    expiry_type: 'pricing',
    expiry_months: 'pricing',
    thumbnail: 'media',
    banner: 'media',
    preview_type: 'media',
    preview_url: 'media',
    preview_file: 'media',
    meta_title: 'seo',
    meta_keywords: 'seo',
    meta_description: 'seo',
    og_title: 'seo',
    og_description: 'seo',
};

const STATUS_STYLES: Record<CourseStatus, { label: string; tone: string }> = {
    approved: {
        label: 'Approved',
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400',
    },
    upcoming: {
        label: 'Upcoming',
        tone: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-400',
    },
    pending: {
        label: 'Pending',
        tone: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400',
    },
    private: {
        label: 'Private',
        tone: 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400',
    },
    draft: {
        label: 'Draft',
        tone: 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-500/20 dark:bg-zinc-500/10 dark:text-zinc-300',
    },
};

/**
 * The course editor ("Manage course contents"), following the Mentor demo: status and preview in the
 * header, then tabs. Basic, Pricing and Media share one form, and each tab's Save sends all of it.
 */
export default function EditCourse({
    course,
    slug,
    status,
    statuses,
    sections,
    liveClasses,
    info,
    ...options
}: EditCourseProps) {
    const { t } = useTranslation();
    // Open the tab named in the URL (?tab=live-class), as the demo's links do.
    const [tab, setTab] = useState<Tab>(() => {
        const requested = new URLSearchParams(
            typeof window === 'undefined' ? '' : window.location.search,
        ).get('tab');

        return TABS.some((item) => item.value === requested)
            ? (requested as Tab)
            : 'curriculum';
    });
    const form = useCourseForm(course);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Courses', href: index() },
            { title: course.title, href: edit(course.id) },
        ],
    });

    const save = (event: FormEvent) => {
        event.preventDefault();
        submitCourseForm(form, course.id);
    };

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
            <Head title={`${t('Manage course contents')} · ${course.title}`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {t('Manage course contents')}
                        </h1>
                        <p className="truncate text-sm text-muted-foreground">
                            {course.title}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <Button asChild>
                            <Link href={learn({ course: slug })}>
                                <Play className="fill-current" />
                                {t('Player')}
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <a
                                href={courseShow.url(slug)}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Eye />
                                {t('Preview')}
                            </a>
                        </Button>
                        <StatusMenu
                            courseId={course.id}
                            status={status}
                            statuses={statuses}
                        />
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
                        {tab === 'curriculum' && (
                            <CourseCurriculum
                                courseId={course.id}
                                sections={sections}
                            />
                        )}

                        {tab === 'basic' && (
                            <TabForm onSubmit={save}>
                                <CourseTextFields form={form} />
                                <CourseDetailFields
                                    form={form}
                                    options={options}
                                />
                                <CourseDripField form={form} />
                                {saveBar}
                            </TabForm>
                        )}

                        {tab === 'pricing' && (
                            <TabForm onSubmit={save}>
                                <CoursePricingFields form={form} />
                                {saveBar}
                            </TabForm>
                        )}

                        {tab === 'media' && (
                            <TabForm onSubmit={save}>
                                <CourseMediaTab form={form} course={course} />
                                {saveBar}
                            </TabForm>
                        )}

                        {tab === 'live-class' && (
                            <CourseLiveClasses
                                courseId={course.id}
                                classes={liveClasses}
                            />
                        )}

                        {tab === 'info' && (
                            <CourseInfo courseId={course.id} lists={info} />
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

function StatusMenu({
    courseId,
    status,
    statuses,
}: {
    courseId: number;
    status: CourseStatus;
    statuses: CourseStatus[];
}) {
    const { t } = useTranslation();
    const current = STATUS_STYLES[status];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        'gap-2 px-3 text-xs font-semibold shadow-sm',
                        current.tone,
                    )}
                >
                    <span className="relative flex size-2">
                        {status === 'approved' && (
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        )}
                        <span className="relative inline-flex size-2 rounded-full bg-current" />
                    </span>
                    {t(current.label)}
                    <ChevronDown className="size-3.5 opacity-60" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                    value={status}
                    onValueChange={(value) =>
                        router.patch(
                            courseStatus.url(courseId),
                            { status: value },
                            { preserveScroll: true, preserveState: true },
                        )
                    }
                >
                    {statuses.map((value) => (
                        <DropdownMenuRadioItem key={value} value={value}>
                            {t(STATUS_STYLES[value].label)}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
