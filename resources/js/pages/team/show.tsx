import { Head } from '@inertiajs/react';
import { BookOpen, MessageSquare, Star, Users } from 'lucide-react';
import { useState } from 'react';
import { CatalogHeading } from '@/components/landing/catalog-layout';
import type { CatalogView } from '@/components/landing/catalog-layout';
import { CourseCard } from '@/components/landing/course-card';
import { PageHeader } from '@/components/landing/page-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { SiteHeader } from '@/components/landing/site-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from '@/hooks/use-translation';
import { index } from '@/routes/team';
import type { Course, Instructor } from '@/types';

type TeamMemberProps = {
    instructor: Instructor & {
        biography: string | null;
        skills: string[] | null;
    };
    courses: Course[];
    stats: {
        learners: number;
        courses: number;
        reviews: number;
        /** Review-weighted average across their courses; null with no reviews. */
        rating: number | null;
    };
};

export default function TeamMember({
    instructor,
    courses,
    stats,
}: TeamMemberProps) {
    const { t } = useTranslation();
    const getInitials = useInitials();
    const [view, setView] = useState<CatalogView>('grid');

    const figures = [
        {
            icon: Users,
            text: t(
                stats.learners === 1 ? ':count learner' : ':count learners',
                {
                    count: stats.learners.toLocaleString(),
                },
            ),
        },
        {
            icon: BookOpen,
            text: t(stats.courses === 1 ? ':count course' : ':count courses', {
                count: stats.courses,
            }),
        },
        {
            icon: MessageSquare,
            text: t(stats.reviews === 1 ? ':count review' : ':count reviews', {
                count: stats.reviews.toLocaleString(),
            }),
        },
    ];

    return (
        <>
            <Head title={instructor.name}>
                <meta
                    name="description"
                    content={t(
                        ':name, :title: :courses courses taken by :learners learners.',
                        {
                            name: instructor.name,
                            title: instructor.title,
                            courses: stats.courses,
                            learners: stats.learners.toLocaleString(),
                        },
                    )}
                />
            </Head>
            <div className="min-h-screen bg-background pt-18 text-foreground">
                <SiteHeader />

                <main>
                    <PageHeader
                        title={instructor.name}
                        parents={[{ label: t('Our Team'), href: index.url() }]}
                    />

                    <section className="mx-auto max-w-7xl space-y-10 px-4 py-16">
                        <Card>
                            <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center">
                                <Avatar className="size-20">
                                    {instructor.avatar_url && (
                                        <AvatarImage
                                            src={instructor.avatar_url}
                                            alt=""
                                        />
                                    )}
                                    <AvatarFallback className="bg-amber-500 text-2xl font-semibold text-white">
                                        {getInitials(
                                            instructor.name.replace(
                                                /^(Dr|Prof)\.\s*/,
                                                '',
                                            ),
                                        )}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <h2 className="text-xl font-semibold">
                                            {instructor.name}
                                        </h2>
                                        <p className="text-muted-foreground">
                                            {instructor.title}
                                        </p>
                                    </div>
                                    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                        {figures.map((figure) => (
                                            <li
                                                key={figure.text}
                                                className="flex items-center gap-2"
                                            >
                                                <figure.icon
                                                    className="size-4 text-muted-foreground"
                                                    aria-hidden
                                                />
                                                {figure.text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {stats.rating !== null && (
                                    <p className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                                        <span className="text-3xl font-bold">
                                            {stats.rating.toFixed(1)}
                                        </span>
                                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Star
                                                className="size-4 fill-amber-400 text-amber-400"
                                                aria-hidden
                                            />
                                            {t('Average rating')}
                                        </span>
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {(instructor.biography ||
                            !!instructor.skills?.length) && (
                            <Card>
                                <CardContent className="space-y-4">
                                    <h2 className="text-lg font-semibold">
                                        {t('About :name', {
                                            name: instructor.name,
                                        })}
                                    </h2>
                                    {instructor.biography && (
                                        <p className="whitespace-pre-line text-muted-foreground">
                                            {instructor.biography}
                                        </p>
                                    )}
                                    {!!instructor.skills?.length && (
                                        <ul className="flex flex-wrap gap-2">
                                            {instructor.skills.map((skill) => (
                                                <li key={skill}>
                                                    <Badge variant="secondary">
                                                        {skill}
                                                    </Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        <div>
                            <CatalogHeading
                                title={t('All courses')}
                                as="h2"
                                view={view}
                                onViewChange={setView}
                            />
                            {courses.length > 0 ? (
                                <div
                                    className={
                                        view === 'grid'
                                            ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
                                            : 'grid gap-4'
                                    }
                                >
                                    {courses.map((course) => (
                                        <CourseCard
                                            key={course.id}
                                            course={course}
                                            layout={view}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                                    {t(':name has no published courses yet.', {
                                        name: instructor.name,
                                    })}
                                </p>
                            )}
                        </div>
                    </section>
                </main>

                <SiteFooter />
            </div>
        </>
    );
}
