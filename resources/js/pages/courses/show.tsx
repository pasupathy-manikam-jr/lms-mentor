import { Head, Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Check,
    Clock,
    FolderOpen,
    Heart,
    Star,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CatalogLayout } from '@/components/landing/catalog-layout';
import { PurchaseAction } from '@/components/landing/purchase-action';
import type { Ownership } from '@/components/landing/purchase-action';
import type { CourseInfoLists } from '@/components/admin/course-info';
import { CourseCard } from '@/components/landing/course-card';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { sentenceCase } from '@/components/landing/job-meta';
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
import { learn } from '@/routes/courses';
import { toggle as wishlistToggle } from '@/routes/learning/wishlist';
import { index as coursesIndex } from '@/routes/courses';
import { show as teamShow } from '@/routes/team';
import type { CatalogCategory, Category, Course, Instructor } from '@/types';

type CourseShowProps = {
    course: Omit<Course, 'category'> & {
        category: Omit<Category, 'courses_count'>;
        instructor: Instructor | null;
        banner_url: string | null;
        /** SEO tab; empty fields fall back to the title and short description. */
        meta_title: string | null;
        meta_keywords: string | null;
        meta_description: string | null;
        og_title: string | null;
        og_description: string | null;
        /** Sanitized HTML from the course editor. */
        description: string | null;
    };
    relatedCourses: Course[];
    categories: CatalogCategory[];
    /** Outcomes, requirements and FAQs from the editor's Info tab. */
    info: CourseInfoLists;
    /** Preview video from the editor's Media tab: an embed URL or an uploaded video. */
    preview: { type: 'embed' | 'video'; src: string | null } | null;
    ownership: Ownership;
    wishlisted: boolean;
};

const formatDuration = (minutes: number) =>
    `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

export default function CourseShow({
    course,
    relatedCourses,
    categories,
    info,
    preview,
    ownership,
    wishlisted,
}: CourseShowProps) {
    const { auth } = usePage().props;
    const metaDescription = course.meta_description || course.short_description;
    const { t } = useTranslation();
    const getInitials = useInitials();
    const categoryUrl = coursesIndex.url({
        query: { category: course.category.slug },
    });

    const facts: { icon: LucideIcon; label: string; value: string }[] = [
        {
            icon: Users,
            label: t('Learners'),
            value: course.students_count.toLocaleString(),
        },
        {
            icon: Clock,
            label: t('Duration'),
            value: formatDuration(course.duration_minutes),
        },
        {
            icon: BarChart3,
            label: t('Level'),
            value: t(sentenceCase(course.level)),
        },
        { icon: FolderOpen, label: t('Category'), value: course.category.name },
    ];

    return (
        <>
            <Head title={course.meta_title || course.title}>
                {metaDescription && (
                    <meta name="description" content={metaDescription} />
                )}
                {course.meta_keywords && (
                    <meta name="keywords" content={course.meta_keywords} />
                )}
                <meta
                    property="og:title"
                    content={
                        course.og_title || course.meta_title || course.title
                    }
                />
                {(course.og_description || metaDescription) && (
                    <meta
                        property="og:description"
                        content={course.og_description || metaDescription || ''}
                    />
                )}
                {course.image_url && (
                    <meta property="og:image" content={course.image_url} />
                )}
            </Head>
            <CatalogLayout
                indexUrl={coursesIndex.url()}
                searchLabel={t('Search courses')}
                categories={categories}
                filters={{ category: course.category.slug }}
            >
                {course.banner_url && (
                    <img
                        src={course.banner_url}
                        alt=""
                        className="mb-6 aspect-[4/1] w-full rounded-xl object-cover"
                    />
                )}
                <div className="grid items-start gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href={coursesIndex()}>
                                            {t('Courses')}
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href={categoryUrl}>
                                            {course.category.name}
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="line-clamp-1">
                                        {course.title}
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        <div className="space-y-4">
                            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                                {course.title}
                            </h1>
                            {course.short_description && (
                                <p className="text-lg text-muted-foreground">
                                    {course.short_description}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                                {course.instructor && (
                                    <span className="flex items-center gap-2 font-medium">
                                        <Avatar className="size-8">
                                            {course.instructor.avatar_url && (
                                                <AvatarImage
                                                    src={
                                                        course.instructor
                                                            .avatar_url
                                                    }
                                                    alt=""
                                                />
                                            )}
                                            <AvatarFallback>
                                                {getInitials(
                                                    course.instructor.name,
                                                )}
                                            </AvatarFallback>
                                        </Avatar>
                                        <Link
                                            href={teamShow.url(
                                                course.instructor.id,
                                            )}
                                            className="hover:underline"
                                        >
                                            {course.instructor.name}
                                        </Link>
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Star
                                        className="size-4 fill-amber-400 text-amber-400"
                                        aria-hidden
                                    />
                                    <span className="font-semibold">
                                        {course.rating}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {t(
                                            course.reviews_count === 1
                                                ? '(:count review)'
                                                : '(:count reviews)',
                                            {
                                                count: course.reviews_count.toLocaleString(),
                                            },
                                        )}
                                    </span>
                                </span>
                                <Badge
                                    variant="secondary"
                                    className="capitalize"
                                >
                                    {t(sentenceCase(course.level))}
                                </Badge>
                            </div>
                        </div>

                        {!!info.outcome?.length && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {t("What you'll learn")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="grid gap-3 sm:grid-cols-2">
                                        {info.outcome.map((item) => (
                                            <li
                                                key={item.id}
                                                className="flex gap-2 text-sm"
                                            >
                                                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                                                {item.title}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {course.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {t('About this course')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent
                                    className="rich-text"
                                    dangerouslySetInnerHTML={{
                                        __html: course.description,
                                    }}
                                />
                            </Card>
                        )}

                        {!!info.requirement?.length && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('Requirements')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc space-y-2 ps-5 text-sm">
                                        {info.requirement.map((item) => (
                                            <li key={item.id}>{item.title}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {!!info.faq?.length && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('FAQs')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Accordion type="single" collapsible>
                                        {info.faq.map((item) => (
                                            <AccordionItem
                                                key={item.id}
                                                value={String(item.id)}
                                            >
                                                <AccordionTrigger className="text-start">
                                                    {item.title}
                                                </AccordionTrigger>
                                                <AccordionContent className="whitespace-pre-line text-muted-foreground">
                                                    {item.body}
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        )}

                        {course.instructor && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {t('Your instructor')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex items-center gap-4">
                                    <Avatar className="size-14">
                                        {course.instructor.avatar_url && (
                                            <AvatarImage
                                                src={
                                                    course.instructor.avatar_url
                                                }
                                                alt=""
                                            />
                                        )}
                                        <AvatarFallback>
                                            {getInitials(
                                                course.instructor.name,
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">
                                            <Link
                                                href={teamShow.url(
                                                    course.instructor.id,
                                                )}
                                                className="hover:underline"
                                            >
                                                {course.instructor.name}
                                            </Link>
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {course.instructor.title}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <Card className="gap-4 overflow-hidden pt-0 lg:sticky lg:top-6">
                        {preview?.type === 'embed' && preview.src ? (
                            <iframe
                                src={preview.src}
                                title={t('Course preview')}
                                className="aspect-video w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
                                allowFullScreen
                            />
                        ) : preview?.type === 'video' && preview.src ? (
                            <video
                                src={preview.src}
                                poster={course.image_url ?? undefined}
                                controls
                                className="aspect-video w-full bg-black"
                            />
                        ) : (
                            course.image_url && (
                                <img
                                    src={course.image_url}
                                    alt=""
                                    className="aspect-video w-full object-cover"
                                />
                            )
                        )}
                        <CardContent className="space-y-4">
                            <p className="text-3xl font-bold">
                                ${course.price}
                                {course.compare_at_price && (
                                    <span className="ml-2 text-base font-normal text-muted-foreground line-through">
                                        ${course.compare_at_price}
                                    </span>
                                )}
                            </p>
                            <PurchaseAction
                                type="course"
                                slug={course.slug}
                                price={course.price}
                                isSignedIn={!!auth.user}
                                ownership={ownership}
                                freeLabel={t('Enrol for free')}
                                buyLabel={t('Enrol now')}
                                owned={
                                    <Button className="w-full" asChild>
                                        <Link
                                            href={learn.url({
                                                course: course.slug,
                                            })}
                                        >
                                            {t('Go to course')}
                                        </Link>
                                    </Button>
                                }
                            />
                            {auth.user && (
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    aria-pressed={wishlisted}
                                    asChild
                                >
                                    <Link
                                        href={wishlistToggle.url(course.slug)}
                                        method="post"
                                        as="button"
                                        preserveScroll
                                    >
                                        <Heart
                                            className={
                                                wishlisted
                                                    ? 'fill-rose-500 text-rose-500'
                                                    : ''
                                            }
                                        />
                                        {wishlisted
                                            ? t('Saved to wishlist')
                                            : t('Add to wishlist')}
                                    </Link>
                                </Button>
                            )}
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

                {relatedCourses.length > 0 && (
                    <section className="mt-12">
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <h2 className="text-2xl font-bold">
                                {t('More in :category', {
                                    category: course.category.name,
                                })}
                            </h2>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={categoryUrl}>{t('View all')}</Link>
                            </Button>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {relatedCourses.map((related) => (
                                <CourseCard key={related.id} course={related} />
                            ))}
                        </div>
                    </section>
                )}
            </CatalogLayout>
        </>
    );
}
