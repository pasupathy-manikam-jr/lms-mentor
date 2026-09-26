import { Link } from '@inertiajs/react';
import { BookOpen, Users } from 'lucide-react';
import { PageHead } from '@/components/landing/page-head';
import { PageHeader } from '@/components/landing/page-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { SiteHeader } from '@/components/landing/site-header';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from '@/hooks/use-translation';
import { usePageContent } from '@/lib/page-content';
import type { PageProps } from '@/lib/page-content';
import { show } from '@/routes/team';
import type { Instructor } from '@/types';

type TeamProps = {
    instructors: (Instructor & {
        courses_count: number;
        // Laravel returns SUM() as a string, or null when there are no courses.
        learners_count: string | null;
    })[];
    page: PageProps;
};

export default function Team({ instructors, page }: TeamProps) {
    const { t } = useTranslation();
    const { text, seo } = usePageContent('team', page);
    const getInitials = useInitials();

    return (
        <>
            <PageHead seo={seo} />
            <div className="min-h-screen bg-background pt-18 text-foreground">
                <SiteHeader />

                <main>
                    <PageHeader title={text('header_title')} />

                    <section className="mx-auto max-w-7xl px-4 py-20">
                        <div className="mx-auto mb-10 max-w-lg text-center">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                {text('intro_title')}
                            </h2>
                            <p className="mt-3 text-muted-foreground">
                                {text('intro_text')}
                            </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {instructors.map((person) => (
                                <div
                                    key={person.id}
                                    className="group relative rounded-2xl border bg-card p-3 shadow-sm transition-shadow hover:shadow-lg"
                                >
                                    <div className="mb-4 flex h-64 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-950 dark:to-orange-900">
                                        {person.avatar_url ? (
                                            <img
                                                src={person.avatar_url}
                                                alt=""
                                                loading="lazy"
                                                className="size-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <span
                                                className="text-6xl font-bold text-amber-700 transition-transform duration-300 group-hover:scale-110 dark:text-amber-300"
                                                aria-hidden
                                            >
                                                {getInitials(
                                                    person.name.replace(
                                                        /^(Dr|Prof)\.\s*/,
                                                        '',
                                                    ),
                                                )}
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1 pb-2 text-center">
                                        <h3 className="font-semibold">
                                            {/* The stretched link makes the whole card clickable. */}
                                            <Link
                                                href={show.url(person.id)}
                                                className="after:absolute after:inset-0"
                                            >
                                                {person.name}
                                            </Link>
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {person.title}
                                        </p>
                                        <p className="flex justify-center gap-4 pt-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <BookOpen
                                                    className="size-3.5"
                                                    aria-hidden
                                                />
                                                {t(
                                                    person.courses_count === 1
                                                        ? ':count course'
                                                        : ':count courses',
                                                    {
                                                        count: person.courses_count,
                                                    },
                                                )}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users
                                                    className="size-3.5"
                                                    aria-hidden
                                                />
                                                {t(
                                                    Number(
                                                        person.learners_count ??
                                                            0,
                                                    ) === 1
                                                        ? ':count learner'
                                                        : ':count learners',
                                                    {
                                                        count: Number(
                                                            person.learners_count ??
                                                                0,
                                                        ).toLocaleString(),
                                                    },
                                                )}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </main>

                <SiteFooter />
            </div>
        </>
    );
}
