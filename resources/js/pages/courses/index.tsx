import { Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    CatalogHeading,
    CatalogLayout,
    CatalogPagination,
} from '@/components/landing/catalog-layout';
import type {
    CatalogFilters,
    CatalogView,
} from '@/components/landing/catalog-layout';
import { CourseCard } from '@/components/landing/course-card';
import { useTranslation } from '@/hooks/use-translation';
import { index as coursesIndex } from '@/routes/courses';
import type { CatalogCategory, Course } from '@/types';

type CoursesProps = {
    courses: {
        data: Course[];
        from: number | null;
        to: number | null;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    categories: CatalogCategory[];
    filters: CatalogFilters;
};

export default function Courses({
    courses,
    categories,
    filters,
}: CoursesProps) {
    const { t } = useTranslation();
    const [view, setView] = useState<CatalogView>('grid');

    const activeCategory = categories.find(
        (category) => category.slug === filters.category,
    );

    return (
        <>
            <Head title={t('Courses')} />
            <CatalogLayout
                indexUrl={coursesIndex.url()}
                searchLabel={t('Search courses')}
                categories={categories}
                filters={filters}
            >
                <CatalogHeading
                    title={
                        activeCategory
                            ? t(':category courses', {
                                  category: activeCategory.name,
                              })
                            : t('All courses')
                    }
                    view={view}
                    onViewChange={setView}
                />

                {courses.data.length > 0 ? (
                    <div
                        className={
                            view === 'grid'
                                ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
                                : 'grid gap-4'
                        }
                    >
                        {courses.data.map((course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                layout={view}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                        {t('No courses match these filters.')}
                    </p>
                )}

                <CatalogPagination paginator={courses} />
            </CatalogLayout>
        </>
    );
}
