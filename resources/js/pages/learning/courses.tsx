import { Head, Link } from '@inertiajs/react';
import { BookOpen, CircleCheck } from 'lucide-react';
import { PageHeader } from '@/components/landing/page-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { SiteHeader } from '@/components/landing/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { index as coursesIndex, learn } from '@/routes/courses';
import { show as examShow } from '@/routes/exams';

type MyCourse = {
    id: number;
    course: {
        title: string;
        slug: string;
        image_url: string | null;
        instructor: string | null;
    };
    total: number;
    done: number;
    progress: number;
    completed: boolean;
    expired: boolean;
};

type MyExam = {
    title: string;
    slug: string;
    image_url: string | null;
    passed: boolean;
};

/**
 * My Courses (from the avatar menu): the courses a learner is enrolled in with their progress, and
 * their exams.
 */
export default function MyCourses({
    courses,
    exams,
}: {
    courses: MyCourse[];
    exams: MyExam[];
}) {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('My courses')} />
            <div className="min-h-screen bg-background pt-18 text-foreground">
                <SiteHeader />
                <main>
                    <PageHeader title={t('My courses')} />
                    <section className="mx-auto max-w-6xl space-y-10 px-4 py-16">
                        {courses.length === 0 ? (
                            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
                                <BookOpen className="size-10 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                    {t(
                                        'You are not enrolled in any course yet.',
                                    )}
                                </p>
                                <Button asChild>
                                    <Link href={coursesIndex()}>
                                        {t('Browse courses')}
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {courses.map((item) => (
                                    <Card
                                        key={item.id}
                                        className="gap-0 overflow-hidden py-0"
                                    >
                                        {item.course.image_url && (
                                            <img
                                                src={item.course.image_url}
                                                alt=""
                                                className="aspect-video w-full object-cover"
                                            />
                                        )}
                                        <CardContent className="space-y-3 py-4">
                                            <div>
                                                <p className="font-semibold leading-snug">
                                                    {item.course.title}
                                                </p>
                                                {item.course.instructor && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.course.instructor}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-primary"
                                                        style={{
                                                            width: `${item.progress}%`,
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {t(
                                                        ':done of :total lessons · :progress%',
                                                        {
                                                            done: String(
                                                                item.done,
                                                            ),
                                                            total: String(
                                                                item.total,
                                                            ),
                                                            progress: String(
                                                                item.progress,
                                                            ),
                                                        },
                                                    )}
                                                </p>
                                            </div>
                                            {item.expired ? (
                                                <Badge variant="secondary">
                                                    {t('Access expired')}
                                                </Badge>
                                            ) : (
                                                <Button
                                                    className="w-full"
                                                    variant={
                                                        item.completed
                                                            ? 'outline'
                                                            : 'default'
                                                    }
                                                    asChild
                                                >
                                                    <Link
                                                        href={learn.url({
                                                            course: item.course
                                                                .slug,
                                                        })}
                                                    >
                                                        {item.completed ? (
                                                            <>
                                                                <CircleCheck />
                                                                {t(
                                                                    'Completed · review',
                                                                )}
                                                            </>
                                                        ) : item.done > 0 ? (
                                                            t('Continue')
                                                        ) : (
                                                            t('Start course')
                                                        )}
                                                    </Link>
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {exams.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold">
                                    {t('My exams')}
                                </h2>
                                <ul className="grid gap-3 sm:grid-cols-2">
                                    {exams.map((exam) => (
                                        <li key={exam.slug}>
                                            <Link
                                                href={examShow.url(exam.slug)}
                                                className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted/50"
                                            >
                                                {exam.image_url && (
                                                    <img
                                                        src={exam.image_url}
                                                        alt=""
                                                        className="size-14 rounded-lg object-cover"
                                                    />
                                                )}
                                                <span className="flex-1 font-medium">
                                                    {exam.title}
                                                </span>
                                                {exam.passed && (
                                                    <Badge>{t('Passed')}</Badge>
                                                )}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </section>
                </main>
                <SiteFooter />
            </div>
        </>
    );
}
