import { Head, Link, router } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Circle,
    CircleCheck,
    Code,
    Download,
    ExternalLink,
    Expand,
    FileQuestion,
    FileText,
    ImageIcon,
    Minimize,
    Monitor,
    Moon,
    Sun,
    TvMinimalPlay,
    Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useLiveClassDate } from '@/components/admin/course-live-classes';
import type { LiveClassItem } from '@/components/admin/course-live-classes';
import AppLogo from '@/components/app-logo';
import { NotificationsMenu, ProfileMenu } from '@/components/header-actions';
import { SiteFooter } from '@/components/landing/site-footer';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
    Sidebar,
    SidebarContent,
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import type { Appearance } from '@/hooks/use-appearance';
import { useCustomization } from '@/hooks/use-customization';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import { certificate, finish, learn } from '@/routes/courses';
import { complete as completeLesson } from '@/routes/courses/learn';

type ContentType =
    | 'video'
    | 'video_url'
    | 'document'
    | 'image'
    | 'text'
    | 'embed';

type Item = {
    id: number;
    type: 'lesson' | 'quiz';
    content_type: ContentType | null;
    title: string;
    duration_minutes: number;
};

/** The item on screen, with its content. `src` is the file route, video embed or embed URL. */
type CurrentItem = Item & {
    src: string | null;
    body: string | null;
    description: string | null;
    /** Links and files attached to a lesson; files download through a gated route. */
    resources?: {
        id: number;
        title: string;
        type: 'link' | 'file';
        href: string;
    }[];
    /** Extension of an uploaded file; only PDFs preview inline. */
    file_extension: string | null;
    /** Quiz settings; null for lessons. */
    time_limit_seconds: number | null;
    total_mark: number | null;
    pass_mark: number | null;
    retake_attempts: number | null;
};

type PlayerProps = {
    course: { id: number; title: string; slug: string };
    sections: { id: number; title: string; lessons: Item[] }[];
    /** The lesson or quiz on screen; null when the course has no curriculum yet. */
    current: CurrentItem | null;
    previousId: number | null;
    nextId: number | null;
    completedIds: number[];
    /** Only enrolled students can finish a course; admins preview it. */
    enrolled: boolean;
    finishedAt: string | null;
    liveClasses: LiveClassItem[];
};

const CONTENT_ICONS: Record<ContentType, LucideIcon> = {
    video: Video,
    video_url: Video,
    document: FileText,
    image: ImageIcon,
    text: BookOpen,
    embed: Code,
};

const itemIcon = (item: Item): LucideIcon =>
    item.type === 'quiz'
        ? FileQuestion
        : item.content_type
          ? CONTENT_ICONS[item.content_type]
          : BookOpen;

/** Minutes as hh:mm:ss, the way the demo shows durations. */
const clock = (minutes: number) =>
    [Math.floor(minutes / 60), minutes % 60, 0]
        .map((part) => String(part).padStart(2, '0'))
        .join(':');

/**
 * The course player, following the Mentor demo: a header with the course title, the curriculum and
 * progress in a sidebar, and the current lesson or quiz with previous/next arrows.
 */
export default function CoursePlayer({
    course,
    sections,
    current,
    previousId,
    nextId,
    completedIds,
    enrolled,
    finishedAt,
    liveClasses,
}: PlayerProps) {
    const { t } = useTranslation();
    const { customization } = useCustomization();
    const formatDate = useLiveClassDate();
    const [panel, setPanel] = useState<'lessons' | 'live'>('lessons');

    const total = sections.reduce(
        (count, section) => count + section.lessons.length,
        0,
    );
    const done = completedIds.length;
    const percent = total ? Math.round((done / total) * 10000) / 100 : 0;
    const currentSection = sections.find((section) =>
        section.lessons.some((item) => item.id === current?.id),
    );

    return (
        <SidebarProvider
            defaultOpen
            className="flex-col"
            style={{ '--sidebar-width': '20rem' } as CSSProperties}
        >
            <Head
                title={
                    current
                        ? `${current.title} · ${course.title}`
                        : course.title
                }
            />

            <header className="sticky top-0 z-50 h-[60px] border-b bg-background">
                <div className="flex h-full items-center justify-between gap-3 px-4 md:px-8">
                    <Link href={home()} className="flex items-center gap-2">
                        <AppLogo />
                    </Link>
                    <p className="hidden truncate font-semibold sm:block">
                        {course.title}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <LanguageSwitcher />
                        <ThemeMenu />
                        <NotificationsMenu />
                        <FullscreenButton />
                        <ProfileMenu />
                        <SidebarTrigger
                            className="md:hidden"
                            aria-label={t('Course content')}
                        />
                    </div>
                </div>
            </header>

            <div className="flex w-full flex-1">
                <SidebarInset className="min-w-0">
                    <Card className="group relative min-h-[80vh] w-full gap-0 overflow-hidden rounded-lg py-0">
                        {previousId && (
                            <StepLink
                                href={learn.url([course.slug, previousId])}
                                label={t('Previous')}
                                side="start"
                            />
                        )}
                        {nextId && (
                            <StepLink
                                href={learn.url([course.slug, nextId])}
                                label={t('Next')}
                                side="end"
                            />
                        )}

                        {current ? (
                            <>
                                <p className="p-6 text-center text-lg font-bold">
                                    {current.title}
                                </p>
                                <Separator />
                                {current.type === 'quiz' ? (
                                    <QuizSummary quiz={current} />
                                ) : (
                                    <LessonView
                                        courseSlug={course.slug}
                                        lesson={current}
                                        completed={completedIds.includes(
                                            current.id,
                                        )}
                                    />
                                )}
                            </>
                        ) : (
                            <p className="m-auto p-6 text-center text-muted-foreground">
                                {t('This course has no lessons yet.')}
                            </p>
                        )}
                    </Card>
                    <SiteFooter />
                </SidebarInset>

                <Sidebar
                    // The curriculum sits on the reading-end side, like the demo; mirrored in right-to-left layouts.
                    side={customization.direction === 'rtl' ? 'left' : 'right'}
                    collapsible="offcanvas"
                    className="top-[60px] h-[calc(100svh-60px)] shadow-lg"
                >
                    <SidebarContent className="gap-0">
                        <div
                            role="tablist"
                            className="m-2 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-muted-foreground"
                        >
                            {(
                                [
                                    ['lessons', t('Lessons')],
                                    ['live', t('Live classes')],
                                ] as const
                            ).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    role="tab"
                                    aria-selected={panel === value}
                                    onClick={() => setPanel(value)}
                                    className={cn(
                                        'h-9 rounded-md px-3 text-sm font-medium transition-all',
                                        panel === value
                                            ? 'bg-background text-foreground shadow'
                                            : 'hover:text-foreground',
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {panel === 'lessons' ? (
                            <>
                                <div className="space-y-1 px-4 py-6">
                                    <p className="flex justify-between text-xs font-medium text-muted-foreground">
                                        <span>{percent}%</span>
                                        <span>
                                            {t('Completed :done/:total', {
                                                done,
                                                total,
                                            })}
                                        </span>
                                    </p>
                                    <div
                                        role="progressbar"
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-valuenow={percent}
                                        className="h-1 overflow-hidden rounded-full bg-primary/20"
                                    >
                                        <div
                                            className="h-full bg-primary transition-all"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                                <Separator />

                                <div className="space-y-4 px-4 py-6">
                                    <Accordion
                                        type="multiple"
                                        defaultValue={
                                            currentSection
                                                ? [String(currentSection.id)]
                                                : []
                                        }
                                        className="space-y-4"
                                    >
                                        {sections.map((section, index) => (
                                            <AccordionItem
                                                key={section.id}
                                                value={String(section.id)}
                                                className="overflow-hidden rounded-lg border last:border-b"
                                            >
                                                <AccordionTrigger className="px-4 py-3 text-base hover:no-underline data-[state=open]:bg-muted">
                                                    {index + 1}. {section.title}
                                                </AccordionTrigger>
                                                <AccordionContent className="space-y-2 p-2">
                                                    {section.lessons.map(
                                                        (item) => (
                                                            <CurriculumItem
                                                                key={item.id}
                                                                courseSlug={
                                                                    course.slug
                                                                }
                                                                item={item}
                                                                active={
                                                                    item.id ===
                                                                    current?.id
                                                                }
                                                                completed={completedIds.includes(
                                                                    item.id,
                                                                )}
                                                            />
                                                        ),
                                                    )}
                                                    {section.lessons.length ===
                                                        0 && (
                                                        <p className="p-2 text-muted-foreground">
                                                            {t(
                                                                'No lessons in this section yet.',
                                                            )}
                                                        </p>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>

                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        disabled={
                                            !enrolled ||
                                            !!finishedAt ||
                                            total === 0 ||
                                            done < total
                                        }
                                        onClick={() =>
                                            router.post(
                                                finish.url(course.slug),
                                                {},
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        {finishedAt
                                            ? t('Course completed')
                                            : t('Finish course')}
                                    </Button>
                                    {finishedAt && (
                                        <Button className="w-full" asChild>
                                            <Link
                                                href={certificate.url(
                                                    course.slug,
                                                )}
                                            >
                                                <Award />
                                                {t('View certificate')}
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </>
                        ) : liveClasses.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                                <TvMinimalPlay className="size-8 text-muted-foreground" />
                                <p className="font-medium">
                                    {t('No live classes scheduled')}
                                </p>
                            </div>
                        ) : (
                            <ul className="space-y-3 px-4 py-6">
                                {liveClasses.map((liveClass) => (
                                    <li
                                        key={liveClass.id}
                                        className="space-y-2 rounded-lg border p-3"
                                    >
                                        <p className="font-medium">
                                            {liveClass.topic}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDate(liveClass.starts_at)}
                                        </p>
                                        {liveClass.notes && (
                                            <p className="text-xs whitespace-pre-line text-muted-foreground">
                                                {liveClass.notes}
                                            </p>
                                        )}
                                        {liveClass.status === 'ended' ? (
                                            <p className="text-xs font-medium text-muted-foreground">
                                                {t('Ended')}
                                            </p>
                                        ) : (
                                            <Button
                                                size="sm"
                                                className="w-full"
                                                variant={
                                                    liveClass.status === 'live'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                                asChild
                                            >
                                                <a
                                                    href={liveClass.meeting_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {liveClass.status === 'live'
                                                        ? t('Join class')
                                                        : t('Join link')}
                                                </a>
                                            </Button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </SidebarContent>
                </Sidebar>
            </div>
        </SidebarProvider>
    );
}

function CurriculumItem({
    courseSlug,
    item,
    active,
    completed,
}: {
    courseSlug: string;
    item: Item;
    active: boolean;
    completed: boolean;
}) {
    const { t } = useTranslation();
    const Icon = itemIcon(item);
    const Check = completed ? CircleCheck : Circle;

    return (
        <div
            className={cn(
                'flex items-center justify-between gap-3 rounded-sm border p-2',
                active && 'border-primary bg-muted',
            )}
        >
            <Link
                href={learn.url([courseSlug, item.id])}
                aria-current={active ? 'page' : undefined}
                className="flex min-w-0 items-center gap-3 py-1 hover:underline"
            >
                <Check
                    className={cn(
                        'size-4 shrink-0',
                        completed
                            ? 'text-emerald-600'
                            : 'text-muted-foreground',
                    )}
                    aria-label={completed ? t('Completed') : t('Not completed')}
                />
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Icon className="size-4" aria-hidden />
                </span>
                <span className="line-clamp-2">{item.title}</span>
            </Link>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {clock(item.duration_minutes)}
            </span>
        </div>
    );
}

function StepLink({
    href,
    label,
    side,
}: {
    href: string;
    label: string;
    side: 'start' | 'end';
}) {
    const Icon = side === 'start' ? ChevronLeft : ChevronRight;

    return (
        <Link
            href={href}
            aria-label={label}
            className={cn(
                'absolute top-1/2 z-10 flex h-10 w-8 -translate-y-1/2 items-center justify-center bg-foreground text-background opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100 rtl:rotate-180',
                side === 'start' ? 'start-0 rounded-e' : 'end-0 rounded-s',
            )}
        >
            <Icon className="size-6" />
        </Link>
    );
}

function LessonView({
    courseSlug,
    lesson,
    completed,
}: {
    courseSlug: string;
    lesson: CurrentItem;
    completed: boolean;
}) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-1 flex-col gap-6 p-6 md:px-12">
            <LessonContent lesson={lesson} />
            {lesson.description && (
                <p className="mx-auto w-full max-w-3xl whitespace-pre-line text-muted-foreground">
                    {lesson.description}
                </p>
            )}
            {!!lesson.resources?.length && (
                <div className="mx-auto w-full max-w-3xl space-y-2">
                    <p className="font-medium">{t('Resources')}</p>
                    <ul className="space-y-2">
                        {lesson.resources.map((resource) => (
                            <li key={resource.id}>
                                <a
                                    href={resource.href}
                                    {...(resource.type === 'file'
                                        ? { download: true }
                                        : {
                                              target: '_blank',
                                              rel: 'noreferrer',
                                          })}
                                    className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm hover:underline"
                                >
                                    {resource.type === 'file' ? (
                                        <Download className="size-4 shrink-0" />
                                    ) : (
                                        <ExternalLink className="size-4 shrink-0" />
                                    )}
                                    {resource.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <Button
                className="self-center"
                variant={completed ? 'outline' : 'default'}
                onClick={() =>
                    router.post(
                        completeLesson.url([courseSlug, lesson.id]),
                        {},
                        { preserveScroll: true },
                    )
                }
            >
                {completed ? <CircleCheck /> : null}
                {completed ? t('Mark as not complete') : t('Mark as complete')}
            </Button>
        </div>
    );
}

/**
 * Show a lesson by its type. Uploaded files come from the gated file route; embeds are sandboxed.
 */
function LessonContent({ lesson }: { lesson: CurrentItem }) {
    const { t } = useTranslation();
    const { src } = lesson;
    const frame = 'aspect-video w-full rounded-lg border bg-muted';

    if (lesson.content_type === 'text' && lesson.body) {
        return (
            <div
                className="rich-text mx-auto w-full max-w-3xl"
                dangerouslySetInnerHTML={{ __html: lesson.body }}
            />
        );
    }

    if (!src) {
        return (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
                <span className="rounded-full bg-muted p-4">
                    <BookOpen className="size-8 text-muted-foreground" />
                </span>
                <p className="max-w-md text-muted-foreground">
                    {t("This lesson's content hasn't been added yet.")}
                </p>
            </div>
        );
    }

    switch (lesson.content_type) {
        case 'video':
            return (
                <video src={src} controls className={cn(frame, 'bg-black')} />
            );
        case 'video_url':
            return /\.(mp4|webm)(\?|$)/i.test(src) ? (
                <video src={src} controls className={cn(frame, 'bg-black')} />
            ) : (
                <iframe
                    src={src}
                    title={lesson.title}
                    className={frame}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                />
            );
        case 'image':
            return (
                <img
                    src={src}
                    alt={lesson.title}
                    className="mx-auto max-h-[70vh] rounded-lg object-contain"
                />
            );
        case 'embed':
            return (
                <iframe
                    src={src}
                    title={lesson.title}
                    className={cn(frame, 'min-h-[60vh]')}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
                    allowFullScreen
                />
            );
        case 'document':
            return (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {lesson.file_extension === 'pdf' && (
                            <Button variant="outline" size="sm" asChild>
                                <a href={src} target="_blank" rel="noreferrer">
                                    <ExternalLink />
                                    {t('Open in new tab')}
                                </a>
                            </Button>
                        )}
                        <Button variant="outline" size="sm" asChild>
                            <a href={src} download>
                                <Download />
                                {t('Download')}
                            </a>
                        </Button>
                    </div>
                    {lesson.file_extension === 'pdf' ? (
                        <iframe
                            src={src}
                            title={lesson.title}
                            className="h-[70vh] w-full rounded-lg border"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-3 rounded-lg border py-16 text-center">
                            <FileText className="size-10 text-muted-foreground" />
                            <p className="text-muted-foreground">
                                {t(
                                    'This document can’t be previewed here. Download it to open it.',
                                )}
                            </p>
                        </div>
                    )}
                </div>
            );
        default:
            return null;
    }
}

function QuizSummary({ quiz }: { quiz: CurrentItem }) {
    const { t } = useTranslation();
    const limit = quiz.time_limit_seconds ?? quiz.duration_minutes * 60;
    const rows = (entries: [string, string | number][]) =>
        entries.map(([label, value]) => (
            <div key={label} className="flex gap-2 text-sm">
                <p className="text-muted-foreground">{label}</p>
                <p>: {value}</p>
            </div>
        ));

    return (
        <div className="w-full space-y-6 p-6 md:px-12">
            {quiz.body && (
                <div
                    className="rich-text"
                    dangerouslySetInnerHTML={{ __html: quiz.body }}
                />
            )}
            <div className="flex flex-col justify-between gap-6 md:flex-row">
                <div className="space-y-2">
                    <p>{t('Summary')}</p>
                    {rows([
                        [
                            t('Duration'),
                            t(
                                ':hours Hours :minutes Minutes :seconds Seconds',
                                {
                                    hours: Math.floor(limit / 3600),
                                    minutes: Math.floor((limit % 3600) / 60),
                                    seconds: limit % 60,
                                },
                            ),
                        ],
                        [t('Total questions'), 0],
                        [t('Total marks'), quiz.total_mark ?? '—'],
                        [t('Pass marks'), quiz.pass_mark ?? '—'],
                        [t('Retake'), quiz.retake_attempts ?? '—'],
                    ])}
                </div>
                <div className="space-y-2">
                    <p>{t('Result')}</p>
                    {rows([
                        [t('Retake attempts'), 0],
                        [t('Correct answers'), 0],
                        [t('Incorrect answers'), 0],
                        [t('Total marks'), 0],
                        [t('Status'), t('Not attempted')],
                    ])}
                </div>
            </div>
            <div className="mt-6 flex flex-col items-center gap-2 p-6">
                <Button disabled>{t('Start quiz')}</Button>
                <p className="text-sm text-muted-foreground">
                    {t('This quiz has no questions yet.')}
                </p>
            </div>
        </div>
    );
}

function ThemeMenu() {
    const { t } = useTranslation();
    const { appearance, updateAppearance } = useAppearance();
    const icons: Record<Appearance, LucideIcon> = {
        light: Sun,
        dark: Moon,
        system: Monitor,
    };
    const Icon = icons[appearance];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label={t('Toggle theme')}
                >
                    <Icon className="size-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                    value={appearance}
                    onValueChange={(value) =>
                        updateAppearance(value as Appearance)
                    }
                >
                    <DropdownMenuRadioItem value="light">
                        {t('Light')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                        {t('Dark')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                        {t('System')}
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function FullscreenButton() {
    const { t } = useTranslation();
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const sync = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', sync);

        return () => document.removeEventListener('fullscreenchange', sync);
    }, []);

    return (
        <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            aria-label={isFullscreen ? t('Exit fullscreen') : t('Fullscreen')}
            onClick={() =>
                isFullscreen
                    ? document.exitFullscreen()
                    : document.documentElement.requestFullscreen()
            }
        >
            {isFullscreen ? <Minimize /> : <Expand />}
        </Button>
    );
}
