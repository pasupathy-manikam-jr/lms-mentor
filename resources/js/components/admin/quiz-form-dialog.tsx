import { useForm } from '@inertiajs/react';
import type { FormEvent, ReactNode } from 'react';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import lessons from '@/routes/admin/courses/lessons';

/** A quiz as the editor receives it; see CourseController::edit(). */
export type EditableQuiz = {
    id: number;
    title: string;
    body: string;
    time_limit_seconds: number | null;
    total_mark: number | null;
    pass_mark: number | null;
    retake_attempts: number | null;
};

const asText = (value: number | null | undefined) =>
    value === null || value === undefined ? '' : String(value);

/**
 * The demo's Add quiz dialog: title, time limit, marks, retake attempts and a summary. Also used to
 * update a quiz.
 */
export function QuizFormDialog({
    courseId,
    sectionId,
    sectionTitle,
    quiz,
    onClose,
}: {
    courseId: number;
    sectionId: number;
    sectionTitle: string;
    quiz?: EditableQuiz;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const limit = quiz?.time_limit_seconds ?? null;
    const form = useForm({
        type: 'quiz',
        title: quiz?.title ?? '',
        hours: limit === null ? '' : String(Math.floor(limit / 3600)),
        minutes: limit === null ? '' : String(Math.floor((limit % 3600) / 60)),
        seconds: limit === null ? '' : String(limit % 60),
        total_mark: asText(quiz?.total_mark),
        pass_mark: asText(quiz?.pass_mark),
        retake_attempts: asText(quiz?.retake_attempts ?? 1),
        summary: quiz?.body ?? '',
    });
    const { data, setData, errors } = form;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            preserveState: true,
            onSuccess: onClose,
        };

        if (quiz) {
            form.put(
                lessons.update.url({ course: courseId, lesson: quiz.id }),
                options,
            );
        } else {
            form.post(
                lessons.store.url({ course: courseId, section: sectionId }),
                options,
            );
        }
    };

    const numberField = (
        name: 'hours' | 'minutes' | 'seconds' | 'total_mark' | 'pass_mark',
        label: string,
        max: number,
    ) => (
        <Field label={label} htmlFor={`quiz-${name}`} error={errors[name]}>
            <Input
                id={`quiz-${name}`}
                type="number"
                min="0"
                max={max}
                required
                value={data[name]}
                onChange={(event) => setData(name, event.target.value)}
                placeholder={label}
                aria-invalid={!!errors[name]}
            />
        </Field>
    );

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {quiz ? t('Update quiz') : t('Add quiz')}
                    </DialogTitle>
                    <DialogDescription>{sectionTitle}</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="min-w-0 space-y-4 p-0.5">
                    <Field
                        label={t('Title')}
                        htmlFor="quiz-title"
                        error={errors.title}
                    >
                        <Input
                            id="quiz-title"
                            required
                            value={data.title}
                            onChange={(event) =>
                                setData('title', event.target.value)
                            }
                            placeholder={t('Enter quiz title')}
                            aria-invalid={!!errors.title}
                            autoFocus
                        />
                    </Field>

                    <div className="grid grid-cols-3 gap-4">
                        {numberField('hours', t('Hours'), 23)}
                        {numberField('minutes', t('Minutes'), 59)}
                        {numberField('seconds', t('Seconds'), 59)}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {numberField('total_mark', t('Total mark'), 1000)}
                        {numberField('pass_mark', t('Pass mark'), 1000)}
                        <Field
                            label={t('Retake attempts')}
                            htmlFor="quiz-retake"
                            error={errors.retake_attempts}
                        >
                            <Input
                                id="quiz-retake"
                                type="number"
                                min="1"
                                max="100"
                                required
                                value={data.retake_attempts}
                                onChange={(event) =>
                                    setData(
                                        'retake_attempts',
                                        event.target.value,
                                    )
                                }
                                placeholder="00"
                                aria-invalid={!!errors.retake_attempts}
                            />
                        </Field>
                    </div>

                    <Field
                        label={t('Quiz summary')}
                        htmlFor="quiz-summary"
                        error={errors.summary}
                    >
                        <RichTextEditor
                            id="quiz-summary"
                            value={data.summary}
                            onChange={(html) => setData('summary', html)}
                            placeholder={t('Type your content here...')}
                            invalid={!!errors.summary}
                        />
                    </Field>

                    <DialogFooter className="pt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                {t('Close')}
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner />}
                            {t('Submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    htmlFor,
    error,
    children,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <Label htmlFor={htmlFor} className="mb-2 inline-block">
                {label}
            </Label>
            {children}
            <InputError message={error} className="mt-2" />
        </div>
    );
}
