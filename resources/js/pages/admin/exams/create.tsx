import { Head } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    CoursePricingFields,
    CourseTextFields,
    ImageField,
} from '@/components/admin/course-form';
import {
    ExamDetailFields,
    ExamSettingsFields,
    submitExamForm,
    useExamForm,
} from '@/components/admin/exam-form';
import type { ExamFormOptions } from '@/components/admin/exam-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import { create, index } from '@/routes/admin/exams';

/**
 * Create Exam, following the Mentor demo: text and description on the left, and instructor, category,
 * settings, pricing and thumbnail on the right. Saving opens the editor to add questions.
 */
export default function CreateExam(options: ExamFormOptions) {
    const { t } = useTranslation();
    const form = useExamForm(null);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        submitExamForm(form);
    };

    return (
        <>
            <Head title={t('Create exam')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t('Create exam')}
                </h1>

                <Card className="p-6">
                    <form
                        onSubmit={submit}
                        className="grid grid-cols-1 gap-6 md:grid-cols-2"
                    >
                        <div className="min-w-0 space-y-6">
                            <CourseTextFields
                                form={form}
                                placeholders={{
                                    title: t('Enter exam title'),
                                    short: t(
                                        'Brief description for exam cards',
                                    ),
                                    description: t(
                                        'Enter detailed exam description...',
                                    ),
                                }}
                            />
                        </div>

                        <div className="min-w-0 space-y-6">
                            <ExamDetailFields form={form} options={options} />
                            <ExamSettingsFields form={form} />
                            <CoursePricingFields
                                form={form}
                                priceLabel={t('Enter your exam price ($0)')}
                            />
                            <ImageField
                                form={form}
                                name="thumbnail"
                                label={t('Thumbnail')}
                                currentUrl={null}
                            />
                        </div>

                        <div className="text-end md:col-span-2">
                            <Button type="submit" disabled={form.processing}>
                                {form.processing && <Spinner />}
                                {t('Create exam')}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </>
    );
}

CreateExam.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Exams', href: index() },
        { title: 'Create exam', href: create() },
    ],
};
