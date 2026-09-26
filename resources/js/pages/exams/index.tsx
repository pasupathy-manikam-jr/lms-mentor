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
import { ExamCard } from '@/components/landing/exam-card';
import { useTranslation } from '@/hooks/use-translation';
import { index as examsIndex } from '@/routes/exams';
import type { CatalogCategory, Exam } from '@/types';

type ExamsProps = {
    exams: {
        data: Exam[];
        from: number | null;
        to: number | null;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    categories: CatalogCategory[];
    filters: CatalogFilters;
};

export default function Exams({ exams, categories, filters }: ExamsProps) {
    const { t } = useTranslation();
    const [view, setView] = useState<CatalogView>('grid');

    const activeCategory = categories.find(
        (category) => category.slug === filters.category,
    );

    return (
        <>
            <Head title={t('Exams')} />
            <CatalogLayout
                indexUrl={examsIndex.url()}
                searchLabel={t('Search exams')}
                categories={categories}
                filters={filters}
            >
                <CatalogHeading
                    title={
                        activeCategory
                            ? t(':category exams', {
                                  category: activeCategory.name,
                              })
                            : t('All exams')
                    }
                    view={view}
                    onViewChange={setView}
                />

                {exams.data.length > 0 ? (
                    <div
                        className={
                            view === 'grid'
                                ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'
                                : 'grid gap-4'
                        }
                    >
                        {exams.data.map((exam) => (
                            <ExamCard key={exam.id} exam={exam} layout={view} />
                        ))}
                    </div>
                ) : (
                    <p className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
                        {t('No exams match these filters.')}
                    </p>
                )}

                <CatalogPagination paginator={exams} />
            </CatalogLayout>
        </>
    );
}
