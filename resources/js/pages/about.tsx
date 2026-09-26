import { Link } from '@inertiajs/react';
import { CountUp } from '@/components/landing/count-up';
import { NewsletterForm } from '@/components/landing/newsletter-form';
import { PageHead } from '@/components/landing/page-head';
import { PageHeader } from '@/components/landing/page-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { SiteHeader } from '@/components/landing/site-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from '@/hooks/use-translation';
import { usePageContent } from '@/lib/page-content';
import type { PageProps } from '@/lib/page-content';
import { index as coursesIndex } from '@/routes/courses';
import { show as teamShow } from '@/routes/team';
import type { Instructor } from '@/types';

type AboutProps = {
    stats: { courses: number; learners: number; instructors: number };
    instructors: Instructor[];
    page: PageProps;
};

// AI-generated scene images (public/images); illustrative, not real people.
const missionImages = [
    {
        src: '/images/hero/ayurveda-physician.webp',
        alt: 'An Ayurveda physician reading a patient’s pulse in a clinic lined with herbs',
    },
    {
        src: '/images/hero/management-professor.webp',
        alt: 'A management professor in front of a whiteboard strategy diagram',
    },
];

const learnerImages = [
    '/images/courses/foundations-of-ayurveda-doshas-dhatus-prakriti.webp',
    '/images/courses/human-anatomy-physiology-essentials.webp',
    '/images/courses/principles-of-management-planning-organising-leading.webp',
];

export default function About({ stats, instructors, page }: AboutProps) {
    const getInitials = useInitials();
    const { t } = useTranslation();
    const { text, seo } = usePageContent('about', page);

    const figures = [
        { value: stats.courses, label: t('Courses') },
        { value: stats.learners, label: t('Learners enrolled') },
        { value: stats.instructors, label: t('Instructors') },
    ];

    return (
        <>
            <PageHead seo={seo} />
            <div className="min-h-screen bg-background pt-18 text-foreground">
                <SiteHeader />

                <main>
                    <PageHeader title={text('header_title')} />

                    <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 lg:grid-cols-2">
                        <div className="grid gap-6 sm:grid-cols-2">
                            {missionImages.map((image) => (
                                <img
                                    key={image.src}
                                    src={image.src}
                                    alt={t(image.alt)}
                                    loading="lazy"
                                    className="h-80 w-full rounded-2xl object-cover"
                                />
                            ))}
                        </div>
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <h2 className="text-3xl font-bold tracking-tight">
                                    {text('mission_title')}
                                </h2>
                                <p className="text-muted-foreground">
                                    {text('mission_text')}
                                </p>
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-3xl font-bold tracking-tight">
                                    {text('values_title')}
                                </h2>
                                <p className="text-muted-foreground">
                                    {text('values_text')}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-muted/50 py-20">
                        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-[2fr_3fr]">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-bold tracking-tight">
                                        {text('success_title')}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        {text('success_text')}
                                    </p>
                                </div>
                                <Button asChild>
                                    <Link href={coursesIndex()}>
                                        {text('success_button')}
                                    </Link>
                                </Button>
                                <dl className="flex flex-wrap gap-8">
                                    {figures.map((figure) => (
                                        <div
                                            key={figure.label}
                                            className="flex flex-col-reverse"
                                        >
                                            <dt className="text-sm text-muted-foreground">
                                                {figure.label}
                                            </dt>
                                            <dd className="text-3xl font-bold">
                                                <CountUp value={figure.value} />
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                            <div className="grid gap-6 sm:grid-cols-3">
                                {learnerImages.map((src) => (
                                    <img
                                        key={src}
                                        src={src}
                                        alt=""
                                        loading="lazy"
                                        className="h-96 w-full rounded-2xl object-cover"
                                    />
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 lg:grid-cols-[2fr_3fr]">
                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold tracking-tight">
                                {text('team_title')}
                            </h2>
                            <p className="text-muted-foreground">
                                {text('team_text')}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                            {instructors.map((person) => (
                                <div
                                    key={person.id}
                                    className="relative rounded-xl border p-6 text-center transition-shadow hover:shadow-md"
                                >
                                    <Avatar className="mx-auto size-20">
                                        {person.avatar_url && (
                                            <AvatarImage
                                                src={person.avatar_url}
                                                alt=""
                                            />
                                        )}
                                        <AvatarFallback className="bg-amber-500 text-xl font-semibold text-white">
                                            {getInitials(
                                                person.name.replace(
                                                    /^(Dr|Prof)\.\s*/,
                                                    '',
                                                ),
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="mt-3 font-semibold">
                                        {/* The stretched link makes the whole card clickable. */}
                                        <Link
                                            href={teamShow.url(person.id)}
                                            className="after:absolute after:inset-0"
                                        >
                                            {person.name}
                                        </Link>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {person.title}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="mx-auto max-w-7xl px-4 pb-20">
                        <div className="rounded-3xl bg-muted/50 px-6 py-16 text-center">
                            <h2 className="text-3xl font-bold tracking-tight">
                                {text('newsletter_title')}
                            </h2>
                            <p className="mt-3 text-muted-foreground">
                                {text('newsletter_text')}
                            </p>
                            <NewsletterForm />
                        </div>
                    </section>
                </main>

                <SiteFooter />
            </div>
        </>
    );
}
