import { Head, useForm } from '@inertiajs/react';
import { CircleCheck, Clock, Send } from 'lucide-react';
import type { FormEvent } from 'react';
import { InstructorProfileFields } from '@/components/admin/instructor-fields';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import { show, store } from '@/routes/instructor-application';

type Application = {
    status: 'pending' | 'approved' | 'rejected';
    title: string;
    skills: string[] | null;
    biography: string | null;
    resume_name: string | null;
};

/**
 * "Become an instructor": a signed-in user applies to teach, and sees where their application stands.
 */
export default function InstructorApplication({
    application,
}: {
    application: Application | null;
}) {
    const { t } = useTranslation();
    const form = useForm({
        title: application?.title ?? '',
        resume: null as File | null,
        skills: application?.skills ?? [],
        biography: application?.biography ?? '',
    });
    const canApply = !application || application.status === 'rejected';

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(store.url(), { preserveScroll: true });
    };

    return (
        <>
            <Head title={t('Become an instructor')} />
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t('Become an instructor')}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {t(
                            'Share your background and we will review your application. Approved instructors can be assigned courses, exams and store products.',
                        )}
                    </p>
                </div>

                {application?.status === 'pending' && (
                    <Alert>
                        <Clock />
                        <AlertTitle>{t('Application under review')}</AlertTitle>
                        <AlertDescription>
                            {t(
                                'Thanks for applying. We will let you know once an admin has reviewed it.',
                            )}
                        </AlertDescription>
                    </Alert>
                )}
                {application?.status === 'approved' && (
                    <Alert>
                        <CircleCheck />
                        <AlertTitle>{t('You are an instructor')}</AlertTitle>
                        <AlertDescription>
                            {t(
                                'Your application was approved. An admin can now assign you courses.',
                            )}
                        </AlertDescription>
                    </Alert>
                )}
                {application?.status === 'rejected' && (
                    <Alert variant="destructive">
                        <AlertTitle>
                            {t('Your application was not approved')}
                        </AlertTitle>
                        <AlertDescription>
                            {t('You can update your details and apply again.')}
                        </AlertDescription>
                    </Alert>
                )}

                {canApply && (
                    <Card className="p-4 sm:p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <InstructorProfileFields
                                form={form}
                                resumeRequired
                            />
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? <Spinner /> : <Send />}
                                {t('Send application')}
                            </Button>
                        </form>
                    </Card>
                )}
            </div>
        </>
    );
}

InstructorApplication.layout = {
    breadcrumbs: [{ title: 'Become an instructor', href: show() }],
};
