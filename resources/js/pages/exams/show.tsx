import { Head, Link, usePage } from '@inertiajs/react';
import {
    Award,
    BarChart3,
    Clock,
    FileQuestion,
    FolderOpen,
    Star,
    RotateCcw,
    Target,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatDuration } from '@/components/landing/catalog-card';
import { PurchaseAction } from '@/components/landing/purchase-action';
import type { Ownership } from '@/components/landing/purchase-action';
import { CatalogLayout } from '@/components/landing/catalog-layout';
import { ExamCard } from '@/components/landing/exam-card';
import { sentenceCase } from '@/components/landing/job-meta';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from '@/hooks/use-translation';
import { register } from '@/routes';
import attemptRoutes from '@/routes/exams/attempts';
import {
    certificate as examCertificate,
    index as examsIndex,
} from '@/routes/exams';
import { show as teamShow } from '@/routes/team';
import type { CatalogCategory, Category, Exam, Instructor } from '@/types';

type AttemptsInfo = {
    used: number;
    max: number;
    passed: boolean;
    last_id: number | null;
    in_progress: boolean;
};

type ExamShowProps = {
    attempts: AttemptsInfo | null;
    exam: Omit<Exam, 'category' | 'instructor'> & {
        category: Omit<Category, 'courses_count'>;
        instructor: Instructor | null;
        /** Sanitized HTML from the exam editor. */
        description: string | null;
        /** SEO tab; empty fields fall back to the title and short description. */
        meta_title: string | null;
        meta_keywords: string | null;
        meta_description: string | null;
        og_title: string | null;
        og_description: string | null;
    };
    relatedExams: Exam[];
    categories: CatalogCategory[];
    ownership: Ownership;
};

export default function ExamShow({
    exam,
    relatedExams,
    categories,
    ownership,
    attempts,
}: ExamShowProps) {
    const { auth } = usePage().props;
    const { t } = useTranslation();
    const getInitials = useInitials();
    const categoryUrl = examsIndex.url({
        query: { category: exam.category.slug },
    });
    const isFree = Number(exam.price) === 0;

    const format: { icon: LucideIcon; label: string; value: string }[] = [
        {
            icon: FileQuestion,
            label: t('Questions'),
            value: String(exam.questions_count),
        },
        {
            icon: Clock,
            label: t('Time limit'),
            value: formatDuration(exam.duration_minutes),
        },
        {
            icon: Target,
            label: t('Pass mark'),
            value: `${exam.pass_percentage}%`,
        },
        {
            icon: RotateCcw,
            label: t('Attempts'),
            value: String(exam.max_attempts),
        },
    ];

    // Answers come from the exam's own settings, so they stay correct when those change.
    const faqs = [
        {
            q: t('What does this exam cover?'),
            a:
                exam.short_description ??
                t('The core topics of :category.', {
                    category: exam.category.name,
                }),
        },
        {
            q: t('How long do I have?'),
            a: t(
                exam.questions_count === 1
                    ? 'You have :duration to answer :count question. The timer starts when you begin and the exam is submitted when time runs out.'
                    : 'You have :duration to answer :count questions. The timer starts when you begin and the exam is submitted when time runs out.',
                {
                    duration: formatDuration(exam.duration_minutes),
                    count: exam.questions_count,
                },
            ),
        },
        {
            q: t('What is the passing score?'),
            a: t('You need at least :percentage% of the marks to pass.', {
                percentage: exam.pass_percentage,
            }),
        },
        {
            q: t('How many attempts do I get?'),
            a: t(
                exam.max_attempts === 1
                    ? 'You can take the exam up to :count time. Your best result counts.'
                    : 'You can take the exam up to :count times. Your best result counts.',
                { count: exam.max_attempts },
            ),
        },
        {
            q: t('Will I receive a certificate?'),
            a: t(
                'Yes. Pass the exam and you receive a certificate with your name, the exam title and your score.',
            ),
        },
    ];

    const facts: { icon: LucideIcon; label: string; value: string }[] = [
        ...format,
        {
            icon: BarChart3,
            label: t('Level'),
            value: t(sentenceCase(exam.level)),
        },
        { icon: FolderOpen, label: t('Category'), value: exam.category.name },
        {
            icon: Users,
            label: t('Taken by'),
            value: exam.students_count.toLocaleString(),
        },
    ];

    return (
        <>
            <Head title={exam.meta_title || exam.title}>
                {(exam.meta_description || exam.short_description) && (
                    <meta
                        name="description"
                        content={
                            exam.meta_description ||
                            exam.short_description ||
                            ''
                        }
                    />
                )}
                {exam.meta_keywords && (
                    <meta name="keywords" content={exam.meta_keywords} />
                )}
                <meta
                    property="og:title"
                    content={exam.og_title || exam.meta_title || exam.title}
                />
                {exam.og_description && (
                    <meta
                        property="og:description"
                        content={exam.og_description}
                    />
                )}
            </Head>
            <CatalogLayout
                indexUrl={examsIndex.url()}
                searchLabel={t('Search exams')}
                categories={categories}
                filters={{ category: exam.category.slug }}
            >
                <div className="grid items-start gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href={examsIndex()}>
                                            {t('Exams')}
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href={categoryUrl}>
                                            {exam.category.name}
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="line-clamp-1">
                                        {exam.title}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        <div className="space-y-4">
                            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                                {exam.title}
                            </h1>
                            {exam.short_description && (
                                <p className="text-lg text-muted-foreground">
                                    {exam.short_description}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                                {exam.instructor && (
                                    <span className="flex items-center gap-2 font-medium">
                                        <Avatar className="size-8">
                                            {exam.instructor.avatar_url && (
                                                <AvatarImage
                                                    src={
                                                        exam.instructor
                                                            .avatar_url
                                                    }
                                                    alt=""
                                                />
                                            )}
                                            <AvatarFallback>
                                                {getInitials(
                                                    exam.instructor.name,
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <Link
                                            href={teamShow.url(
                                                exam.instructor.id,
                                            )}
                                            className="hover:underline"
                                        >
                                            {exam.instructor.name}
                                        </Link>
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Star
                                        className="size-4 fill-amber-400 text-amber-400"
                                        aria-hidden
                                    />
                                    <span className="font-semibold">
                                        {exam.rating}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {t(
                                            exam.reviews_count === 1
                                                ? '(:count review)'
                                                : '(:count reviews)',
                                            {
                                                count: exam.reviews_count.toLocaleString(),
                                            },
                                        )}
                                    </span>
                                </span>
                                <Badge
                                    variant="secondary"
                                    className="capitalize"
                                >
                                    {t(sentenceCase(exam.level))}
                                </Badge>
                                <span className="flex items-center gap-1 text-muted-foreground">
                                    <Award className="size-4" aria-hidden />
                                    {t('Certificate on passing')}
                                </span>
                            </div>
                        </div>

                        {exam.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {t('About this exam')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent
                                    className="rich-text"
                                    dangerouslySetInnerHTML={{
                                        __html: exam.description,
                                    }}
                                />
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Exam format')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {format.map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex flex-col-reverse gap-1 rounded-lg bg-muted/50 p-4"
                                        >
                                            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <item.icon
                                                    className="size-4"
                                                    aria-hidden
                                                />
                                                {item.label}
                                            </dt>
                                            <dd className="text-2xl font-bold">
                                                {item.value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('FAQs')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Accordion
                                    type="single"
                                    collapsible
                                    defaultValue="faq-0"
                                    className="rounded-xl border px-4"
                                >
                                    {faqs.map((faq, i) => (
                                        <AccordionItem
                                            key={faq.q}
                                            value={`faq-${i}`}
                                        >
                                            <AccordionTrigger className="text-base">
                                                {faq.q}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-muted-foreground">
                                                {faq.a}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>

                        {exam.instructor && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('Set by')}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex items-center gap-4">
                                    <Avatar className="size-14">
                                        {exam.instructor.avatar_url && (
                                            <AvatarImage
                                                src={exam.instructor.avatar_url}
                                                alt=""
                                            />
                                        )}
                                        <AvatarFallback>
                                            {getInitials(exam.instructor.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">
                                            <Link
                                                href={teamShow.url(
                                                    exam.instructor.id,
                                                )}
                                                className="hover:underline"
                                            >
                                                {exam.instructor.name}
                                            </Link>
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {exam.instructor.title}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <Card className="gap-4 overflow-hidden pt-0 lg:sticky lg:top-6">
                        {exam.image_url && (
                            <img
                                src={exam.image_url}
                                alt=""
                                className="aspect-video w-full object-cover"
                            />
                        )}
                        <CardContent
                            className={
                                exam.image_url ? 'space-y-4' : 'space-y-4 pt-6'
                            }
                        >
                            <p className="text-3xl font-bold">
                                {isFree ? t('Free') : `$${exam.price}`}
                                {exam.compare_at_price && (
                                    <span className="ml-2 text-base font-normal text-muted-foreground line-through">
                                        ${exam.compare_at_price}
                                    </span>
                                )}
                            </p>
                            <PurchaseAction
                                type="exam"
                                slug={exam.slug}
                                price={exam.price}
                                isSignedIn={!!auth.user}
                                ownership={ownership}
                                freeLabel={t('Take exam')}
                                buyLabel={t('Buy exam')}
                                owned={
                                    attempts && (
                                        <AttemptActions
                                            slug={exam.slug}
                                            attempts={attempts}
                                        />
                                    )
                                }
                            />
                            <Separator />
                            <dl className="space-y-3 text-sm">
                                {facts.map((fact) => (
                                    <div
                                        key={fact.label}
                                        className="flex items-center justify-between gap-4"
                                    >
                                        <dt className="flex items-center gap-2 text-muted-foreground">
                                            <fact.icon
                                                className="size-4"
                                                aria-hidden
                                            />
                                            {fact.label}
                                        </dt>
                                        <dd className="text-right font-medium capitalize">
                                            {fact.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </CardContent>
                    </Card>
                </div>

                {relatedExams.length > 0 && (
                    <section className="mt-12">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <h2 className="text-2xl font-bold">
                                {t('More in :category', {
                                    category: exam.category.name,
                                })}
                            </h2>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={categoryUrl}>{t('View all')}</Link>
                            </Button>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {relatedExams.map((related) => (
                                <ExamCard key={related.id} exam={related} />
                            ))}
                        </div>
                    </section>
                )}
            </CatalogLayout>
        </>
    );
}

/**
 * For students who have the exam: start or continue an attempt, see the last result, and the
 * certificate once passed.
 */
function AttemptActions({
    slug,
    attempts,
}: {
    slug: string;
    attempts: AttemptsInfo;
}) {
    const { t } = useTranslation();
    const left = attempts.max > 0 ? attempts.max - attempts.used : null;
    const canStart = attempts.in_progress || left === null || left > 0;

    return (
        <div className="space-y-2">
            <Button className="w-full" disabled={!canStart} asChild={canStart}>
                {canStart ? (
                    <Link
                        href={attemptRoutes.store.url(slug)}
                        method="post"
                        as="button"
                    >
                        {attempts.in_progress
                            ? t('Continue exam')
                            : attempts.used > 0
                              ? t('Try again')
                              : t('Start exam')}
                    </Link>
                ) : (
                    <span>{t('No attempts left')}</span>
                )}
            </Button>
            {left !== null && (
                <p className="text-center text-xs text-muted-foreground">
                    {t(':left of :max attempts left', {
                        left: String(Math.max(0, left)),
                        max: String(attempts.max),
                    })}
                </p>
            )}
            {attempts.last_id && !attempts.in_progress && (
                <Button variant="outline" className="w-full" asChild>
                    <Link href={attemptRoutes.show.url(attempts.last_id)}>
                        {t('See last result')}
                    </Link>
                </Button>
            )}
            {attempts.passed && (
                <Button variant="outline" className="w-full" asChild>
                    <Link href={examCertificate.url(slug)}>
                        {t('View certificate')}
                    </Link>
                </Button>
            )}
        </div>
    );
}
