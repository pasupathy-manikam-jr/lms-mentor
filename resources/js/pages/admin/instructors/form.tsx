import { Head, setLayoutProps, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import type { FormEvent } from 'react';
import { Combobox } from '@/components/admin/combobox';
import { Field } from '@/components/admin/course-form';
import { InstructorProfileFields } from '@/components/admin/instructor-fields';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import { create, edit, index, store, update } from '@/routes/admin/instructors';

type EditableInstructor = {
    id: number;
    name: string;
    title: string;
    skills: string[] | null;
    biography: string | null;
    resume_name: string | null;
    user: { id: number; name: string; email: string } | null;
};

/**
 * Create Instructor (pick a user account, as in the Mentor demo) and the admin's edit form.
 */
export default function InstructorForm({
    instructor,
    users,
}: {
    instructor: EditableInstructor | null;
    users: { id: number; name: string; email: string }[];
}) {
    const { t } = useTranslation();
    const form = useForm({
        user_id: '',
        name: instructor?.name ?? '',
        title: instructor?.title ?? '',
        resume: null as File | null,
        skills: instructor?.skills ?? [],
        biography: instructor?.biography ?? '',
    });
    const heading = instructor ? 'Edit instructor' : 'Create instructor';

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Instructors', href: index() },
            instructor
                ? { title: instructor.name, href: edit(instructor.id) }
                : { title: 'Create', href: create() },
        ],
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (!instructor) {
            form.transform(({ name: _name, ...values }) => values);
            form.post(store.url());

            return;
        }

        form.transform(({ user_id: _userId, ...values }) => ({
            ...values,
            _method: 'put',
        }));
        form.post(update.url(instructor.id), {
            preserveScroll: true,
            onSuccess: () => form.setData('resume', null),
        });
    };

    return (
        <>
            <Head title={t(heading)} />
            <form
                onSubmit={submit}
                className="flex flex-1 flex-col gap-6 p-4 md:p-6"
            >
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t(heading)}
                </h1>
                <Card className="gap-6 p-4 sm:p-6">
                    {instructor ? (
                        <Field
                            label={t('Name')}
                            htmlFor="name"
                            required
                            error={form.errors.name}
                        >
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                aria-invalid={!!form.errors.name}
                                className="h-10 rounded-lg"
                            />
                            {instructor.user && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    {t('Account: :email', {
                                        email: instructor.user.email,
                                    })}
                                </p>
                            )}
                        </Field>
                    ) : (
                        <Field
                            label={t('User account')}
                            htmlFor="user_id"
                            required
                            error={form.errors.user_id}
                        >
                            <Combobox
                                id="user_id"
                                value={form.data.user_id}
                                options={users.map((user) => ({
                                    value: String(user.id),
                                    label: user.name,
                                    hint: user.email,
                                }))}
                                onChange={(value) =>
                                    form.setData('user_id', value)
                                }
                                placeholder={t('Select a user')}
                                searchPlaceholder={t('Search users')}
                                emptyText={t('No user found.')}
                                invalid={!!form.errors.user_id}
                            />
                        </Field>
                    )}
                    <InstructorProfileFields
                        form={form}
                        currentResume={instructor?.resume_name}
                    />
                    <div>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? <Spinner /> : <Save />}
                            {t(instructor ? 'Save changes' : 'Submit')}
                        </Button>
                    </div>
                </Card>
            </form>
        </>
    );
}
