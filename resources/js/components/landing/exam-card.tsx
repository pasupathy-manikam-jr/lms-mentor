import { Clock, FileQuestion, Users } from 'lucide-react';
import { CatalogCard, formatDuration } from '@/components/landing/catalog-card';
import { useTranslation } from '@/hooks/use-translation';
import { show } from '@/routes/exams';
import type { Exam } from '@/types';

export function ExamCard({
    exam,
    layout = 'grid',
}: {
    exam: Exam;
    layout?: 'grid' | 'list';
}) {
    const { t } = useTranslation();

    return (
        <CatalogCard
            href={show.url(exam.slug)}
            title={exam.title}
            imageUrl={exam.image_url}
            categoryIcon={exam.category.icon}
            meta={[
                {
                    icon: FileQuestion,
                    text:
                        exam.questions_count === 1
                            ? t(':count question', {
                                  count: exam.questions_count,
                              })
                            : t(':count questions', {
                                  count: exam.questions_count,
                              }),
                },
                { icon: Clock, text: formatDuration(exam.duration_minutes) },
                {
                    icon: Users,
                    text: t(':count taken', {
                        count: exam.students_count.toLocaleString(),
                    }),
                },
            ]}
            byline={exam.instructor?.name}
            rating={exam.rating}
            reviewsCount={exam.reviews_count}
            price={exam.price}
            compareAtPrice={exam.compare_at_price}
            actionLabel={t('View exam')}
            layout={layout}
        />
    );
}
