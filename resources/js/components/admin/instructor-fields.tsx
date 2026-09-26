import { FileText } from 'lucide-react';
import { Field } from '@/components/admin/course-form';
import { TagInput } from '@/components/admin/tag-input';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';

export type InstructorProfile = {
    title: string;
    resume: File | null;
    skills: string[];
    biography: string;
};

type ProfileForm = {
    data: InstructorProfile;
    setData: <K extends keyof InstructorProfile>(
        key: K,
        value: InstructorProfile[K],
    ) => void;
    errors: Partial<Record<string, string>>;
};

/**
 * The demo's instructor fields: designation, resume, skills and biography. Shared by Create
 * Instructor, the admin's edit form and "Become an instructor".
 */
export function InstructorProfileFields({
    form,
    currentResume,
    resumeRequired = false,
}: {
    form: ProfileForm;
    currentResume?: string | null;
    resumeRequired?: boolean;
}) {
    const { t } = useTranslation();
    const { data, setData, errors } = form;

    return (
        <>
            <Field
                label={t('Designation')}
                htmlFor="title"
                required
                error={errors.title}
            >
                <Input
                    id="title"
                    value={data.title}
                    onChange={(event) => setData('title', event.target.value)}
                    placeholder={t('e.g. Ayurveda Physician')}
                    aria-invalid={!!errors.title}
                    className="h-10 rounded-lg"
                />
            </Field>
            <Field
                label={t('Resume')}
                htmlFor="resume"
                required={resumeRequired}
                error={errors.resume}
            >
                <Input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(event) =>
                        setData('resume', event.target.files?.[0] ?? null)
                    }
                    aria-invalid={!!errors.resume}
                    className="h-10 cursor-pointer rounded-lg"
                />
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    {currentResume && <FileText className="size-3.5" />}
                    {currentResume
                        ? t(
                              'Current file: :name. Choose a file to replace it.',
                              {
                                  name: currentResume,
                              },
                          )
                        : t('PDF or Word document, up to 5 MB.')}
                </p>
            </Field>
            <Field
                label={t('Skills')}
                htmlFor="skills"
                error={
                    errors.skills ??
                    Object.entries(errors).find(([key]) =>
                        key.startsWith('skills.'),
                    )?.[1]
                }
            >
                <TagInput
                    id="skills"
                    value={data.skills}
                    onChange={(skills) => setData('skills', skills)}
                    placeholder={t('Type a skill and press Enter')}
                />
            </Field>
            <Field
                label={t('Biography')}
                htmlFor="biography"
                error={errors.biography}
            >
                <Textarea
                    id="biography"
                    rows={5}
                    value={data.biography}
                    onChange={(event) =>
                        setData('biography', event.target.value)
                    }
                    placeholder={t(
                        'Your training, experience and what you teach',
                    )}
                    aria-invalid={!!errors.biography}
                    className="rounded-lg"
                />
            </Field>
        </>
    );
}
