import { Clock, Users } from 'lucide-react';
import { CatalogCard, formatDuration } from '@/components/landing/catalog-card';
import { useTranslation } from '@/hooks/use-translation';
import { show } from '@/routes/courses';
import type { Course } from '@/types';

export function CourseCard({
    course,
    layout = 'grid',
}: {
    course: Course;
    layout?: 'grid' | 'list';
}) {
    const { t } = useTranslation();

    return (
        <CatalogCard
            href={show.url(course.slug)}
            title={course.title}
            imageUrl={course.image_url}
            categoryIcon={course.category.icon}
            meta={[
                {
                    icon: Users,
                    text: t(':count learners', {
                        count: course.students_count.toLocaleString(),
                    }),
                },
                { icon: Clock, text: formatDuration(course.duration_minutes) },
            ]}
            rating={course.rating}
            reviewsCount={course.reviews_count}
            price={course.price}
            compareAtPrice={course.compare_at_price}
            actionLabel={t('View course')}
            layout={layout}
        />
    );
}
