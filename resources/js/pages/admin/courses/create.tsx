import { Head } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    CourseDetailFields,
    CourseDripField,
    CourseMediaFields,
    CoursePricingFields,
    CourseTextFields,
    submitCourseForm,
    useCourseForm,
} from '@/components/admin/course-form';
import type { CourseFormOptions } from '@/components/admin/course-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import { create, index } from '@/routes/admin/courses';

export default function CreateCourse(options: CourseFormOptions) {
    const { t } = useTranslation();
    const form = useCourseForm(null);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        submitCourseForm(form);
    };

    return (
        <>
            <Head title={t('Create course')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t('Create course')}
                </h1>

                <Card className="p-6">
                    <form
                        onSubmit={submit}
                        className="grid grid-cols-1 gap-6 md:grid-cols-2"
                    >
                        <div className="min-w-0 space-y-6">
                            <CourseTextFields form={form} />
                        </div>

                        <div className="min-w-0 space-y-6">
                            <CourseDetailFields form={form} options={options} />
                            <CoursePricingFields form={form} />
                            <CourseMediaFields form={form} />
                            <CourseDripField form={form} />
                        </div>

                        <div className="text-end md:col-span-2">
                            <Button type="submit" disabled={form.processing}>
                                {form.processing && <Spinner />}
                                {t('Create course')}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </>
    );
}

CreateCourse.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Courses', href: index() },
        { title: 'Create course', href: create() },
    ],
};
