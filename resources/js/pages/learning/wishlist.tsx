import { Head, Link } from '@inertiajs/react';
import { Heart } from 'lucide-react';
import { CourseCard } from '@/components/landing/course-card';
import { PageHeader } from '@/components/landing/page-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { SiteHeader } from '@/components/landing/site-header';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { index as coursesIndex } from '@/routes/courses';
import type { Course } from '@/types';

/**
 * The Wishlist (from the avatar menu): courses the learner saved for later.
 */
export default function Wishlist({ courses }: { courses: Course[] }) {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('Wishlist')} />
            <div className="min-h-screen bg-background pt-18 text-foreground">
                <SiteHeader />
                <main>
                    <PageHeader title={t('Wishlist')} />
                    <section className="mx-auto max-w-6xl px-4 py-16">
                        {courses.length === 0 ? (
                            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
                                <Heart className="size-10 text-muted-foreground" />
                                <p className="text-muted-foreground">
                                    {t(
                                        'Your wishlist is empty. Tap the heart on a course to save it here.',
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
                                {courses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </main>
                <SiteFooter />
            </div>
        </>
    );
}
