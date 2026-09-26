import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import lessons from '@/routes/admin/courses/lessons';

export type LessonContentType =
    | 'video'
    | 'video_url'
    | 'document'
    | 'image'
    | 'text'
    | 'embed';

/** A lesson as the editor receives it; see CourseController::edit(). */
export type EditableLesson = {
    id: number;
    title: string;
    duration_minutes: number;
    content_type: LessonContentType | null;
    url: string | null;
    body: string;
    description: string | null;
    has_file: boolean;
};

/** The demo's lesson types, in its order. The AI option is shown but not available yet. */
const TYPES: { value: LessonContentType | 'text_ai'; label: string }[] = [
    { value: 'video', label: 'Video file' },
    { value: 'video_url', label: 'Video URL' },
    { value: 'document', label: 'Document file' },
    { value: 'image', label: 'Image file' },
    { value: 'text', label: 'Text content' },
    { value: 'embed', label: 'Embed source' },
    { value: 'text_ai', label: 'Text content with AI' },
];

const FILE_ACCEPT: Partial<Record<LessonContentType, string>> = {
    video: 'video/mp4,video/webm,video/quicktime',
    document: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt',
    image: 'image/jpeg,image/png,image/webp,image/gif',
};

const FILE_HINT: Partial<Record<LessonContentType, string>> = {
    video: 'MP4, WebM or MOV, up to 45 MB.',
    document: 'PDF, Word, PowerPoint, Excel or text, up to 20 MB.',
    image: 'JPG, PNG, WebP or GIF, up to 5 MB.',
};

/**
 * The demo's two-step Add lesson dialog: pick the lesson type, then fill in its details. Also used to
 * edit a lesson, starting on the details step.
 */
export function LessonFormDialog({
    courseId,
    sectionId,
    sectionTitle,
    lesson,
    onClose,
}: {
    courseId: number;
    sectionId: number;
    sectionTitle: string;
    lesson?: EditableLesson;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const [step, setStep] = useState<'type' | 'form'>(lesson ? 'form' : 'type');
    const form = useForm({
        type: 'lesson',
        content_type: (lesson?.content_type ?? 'video') as LessonContentType,
        title: lesson?.title ?? '',
        duration_minutes: String(lesson?.duration_minutes ?? ''),
        file: null as File | null,
        url: lesson?.url ?? '',
        body: lesson?.body ?? '',
        description: lesson?.description ?? '',
    });
    const { data, setData, errors } = form;
    const isFileType = data.content_type in FILE_ACCEPT;
    const keepsFile =
        lesson?.has_file && lesson.content_type === data.content_type;

    const submit = (event: FormEvent) => {
        event.preventDefault();

        // Only send the fields that belong to the chosen type.
        form.transform((values) => ({
            ...values,
            file: isFileType ? values.file : null,
            url:
                data.content_type === 'video_url' ||
                data.content_type === 'embed'
                    ? values.url
                    : '',
            body: data.content_type === 'text' ? values.body : '',
            ...(lesson ? { _method: 'put' } : {}),
        }));
        form.post(
            lesson
                ? lessons.update.url({ course: courseId, lesson: lesson.id })
                : lessons.store.url({ course: courseId, section: sectionId }),
            {
                forceFormData: true,
                preserveScroll: true,
                preserveState: true,
                onSuccess: onClose,
            },
        );
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className={cn(
                    'max-h-[90svh] overflow-y-auto',
                    step === 'form' && data.content_type === 'text'
                        ? 'sm:max-w-3xl'
                        : 'sm:max-w-lg',
                )}
            >
                <DialogHeader>
                    <DialogTitle>
                        {lesson ? t('Update lesson') : t('Add lesson')}
                    </DialogTitle>
                    <DialogDescription>{sectionTitle}</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="min-w-0">
                    {step === 'type' ? (
                        <fieldset className="space-y-1">
                            <legend className="mb-2 text-sm font-semibold">
                                {t('Lesson type')}
                            </legend>
                            <div className="grid grid-cols-2 gap-3">
                                {TYPES.map((option) => {
                                    const isAi = option.value === 'text_ai';

                                    return (
                                        <label
                                            key={option.value}
                                            className={cn(
                                                'flex items-center gap-2 rounded-lg border p-2 text-sm font-medium',
                                                isAi
                                                    ? 'cursor-not-allowed text-violet-700 opacity-60 dark:text-violet-400'
                                                    : 'cursor-pointer has-checked:border-primary',
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="content_type"
                                                value={option.value}
                                                disabled={isAi}
                                                checked={
                                                    data.content_type ===
                                                    option.value
                                                }
                                                onChange={() =>
                                                    setData(
                                                        'content_type',
                                                        option.value as LessonContentType,
                                                    )
                                                }
                                                className="size-4 accent-primary"
                                            />
                                            <span>{t(option.label)}</span>
                                            {isAi && (
                                                <span className="ms-auto text-xs">
                                                    {t('Soon')}
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </fieldset>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {t('Lesson type')}:{' '}
                                <span className="font-medium text-foreground">
                                    {t(
                                        TYPES.find(
                                            (option) =>
                                                option.value ===
                                                data.content_type,
                                        )?.label ?? '',
                                    )}
                                </span>
                            </p>

                            <div className="space-y-2">
                                <Label htmlFor="lesson-title">
                                    {t('Title')} *
                                </Label>
                                <Input
                                    id="lesson-title"
                                    value={data.title}
                                    onChange={(event) =>
                                        setData('title', event.target.value)
                                    }
                                    placeholder={t('Enter title')}
                                    aria-invalid={!!errors.title}
                                    autoFocus
                                />
                                <InputError message={errors.title} />
                            </div>

                            {isFileType && (
                                <div className="space-y-2">
                                    <Label htmlFor="lesson-file">
                                        {t('File')} {!keepsFile && '*'}
                                    </Label>
                                    <Input
                                        id="lesson-file"
                                        type="file"
                                        accept={FILE_ACCEPT[data.content_type]}
                                        onChange={(event) =>
                                            setData(
                                                'file',
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                        aria-invalid={!!errors.file}
                                        className="cursor-pointer"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {keepsFile
                                            ? t(
                                                  'Leave empty to keep the current file.',
                                              )
                                            : t(
                                                  FILE_HINT[
                                                      data.content_type
                                                  ] ?? '',
                                              )}
                                    </p>
                                    {form.progress && (
                                        <progress
                                            value={form.progress.percentage}
                                            max={100}
                                            className="h-1.5 w-full accent-primary"
                                        />
                                    )}
                                    <InputError message={errors.file} />
                                </div>
                            )}

                            {(data.content_type === 'video_url' ||
                                data.content_type === 'embed') && (
                                <div className="space-y-2">
                                    <Label htmlFor="lesson-url">
                                        {data.content_type === 'embed'
                                            ? t('Embed source')
                                            : t('Video URL')}{' '}
                                        *
                                    </Label>
                                    <Input
                                        id="lesson-url"
                                        type="url"
                                        value={data.url}
                                        onChange={(event) =>
                                            setData('url', event.target.value)
                                        }
                                        placeholder={
                                            data.content_type === 'embed'
                                                ? 'https://'
                                                : 'https://www.youtube.com/watch?v=…'
                                        }
                                        aria-invalid={!!errors.url}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {data.content_type === 'embed'
                                            ? t(
                                                  'An https page to show inside the lesson, such as a slide deck or simulation.',
                                              )
                                            : t(
                                                  'YouTube or Vimeo link, or a direct link to an MP4 or WebM file.',
                                              )}
                                    </p>
                                    <InputError message={errors.url} />
                                </div>
                            )}

                            {data.content_type === 'text' && (
                                <div className="space-y-2">
                                    <Label htmlFor="lesson-body">
                                        {t('Text content')} *
                                    </Label>
                                    <RichTextEditor
                                        id="lesson-body"
                                        value={data.body}
                                        onChange={(html) =>
                                            setData('body', html)
                                        }
                                        placeholder={t('Write the lesson')}
                                        invalid={!!errors.body}
                                    />
                                    <InputError message={errors.body} />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="lesson-duration">
                                    {t('Duration (minutes)')} *
                                </Label>
                                <Input
                                    id="lesson-duration"
                                    type="number"
                                    min="0"
                                    max="1440"
                                    value={data.duration_minutes}
                                    onChange={(event) =>
                                        setData(
                                            'duration_minutes',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={!!errors.duration_minutes}
                                />
                                <InputError message={errors.duration_minutes} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lesson-description">
                                    {t('Description')}
                                </Label>
                                <Textarea
                                    id="lesson-description"
                                    rows={3}
                                    value={data.description}
                                    onChange={(event) =>
                                        setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'What learners will get from this lesson',
                                    )}
                                    aria-invalid={!!errors.description}
                                />
                                <InputError message={errors.description} />
                            </div>
                            <InputError message={errors.content_type} />
                        </div>
                    )}

                    <DialogFooter className="pt-8">
                        <div className="flex w-full items-center gap-4">
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    {t('Close')}
                                </Button>
                            </DialogClose>
                            {step === 'type' ? (
                                <Button
                                    type="button"
                                    onClick={() => setStep('form')}
                                >
                                    {t('Next')}
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => setStep('type')}
                                    >
                                        {t('Back')}
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="ms-auto"
                                        disabled={form.processing}
                                    >
                                        {form.processing && <Spinner />}
                                        {lesson
                                            ? t('Save changes')
                                            : t('Add lesson')}
                                    </Button>
                                </>
                            )}
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
