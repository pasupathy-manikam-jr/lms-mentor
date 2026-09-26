import { router, useForm } from '@inertiajs/react';
import { EllipsisVertical, FileText, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import resources from '@/routes/admin/courses/lessons/resources';

export type LessonResource = {
    id: number;
    title: string;
    type: 'link' | 'file';
    /** The link target; null for uploaded files, which stay private. */
    url: string | null;
};

const visit = { preserveScroll: true, preserveState: true };

/**
 * The demo's Lesson Resources dialog: a Resource List tab and an Add Resource tab.
 */
export function LessonResourcesDialog({
    courseId,
    lesson,
    onClose,
}: {
    courseId: number;
    lesson: { id: number; title: string; resources: LessonResource[] };
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const [tab, setTab] = useState<'list' | 'add'>(
        lesson.resources.length ? 'list' : 'add',
    );
    const form = useForm({
        title: '',
        type: 'link' as LessonResource['type'],
        url: '',
        file: null as File | null,
    });
    const { data, setData, errors } = form;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(
            resources.store.url({ course: courseId, lesson: lesson.id }),
            {
                ...visit,
                forceFormData: true,
                onSuccess: () => {
                    form.reset();
                    setTab('list');
                },
            },
        );
    };

    const remove = (resource: LessonResource) =>
        router.delete(
            resources.destroy.url({
                course: courseId,
                lesson: lesson.id,
                resource: resource.id,
            }),
            visit,
        );

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
                <DialogHeader className="mb-2">
                    <DialogTitle>{t('Lesson resources')}</DialogTitle>
                    <DialogDescription>{lesson.title}</DialogDescription>
                </DialogHeader>

                <div
                    role="tablist"
                    className="grid h-11 grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-muted-foreground"
                >
                    {(
                        [
                            ['list', t('Resource list')],
                            ['add', t('Add resource')],
                        ] as const
                    ).map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            role="tab"
                            aria-selected={tab === value}
                            onClick={() => setTab(value)}
                            className={cn(
                                'rounded-md px-3 text-sm font-medium transition-all',
                                tab === value
                                    ? 'bg-background text-foreground shadow'
                                    : 'hover:text-foreground',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {tab === 'list' ? (
                    <div className="space-y-4 py-3">
                        {lesson.resources.length === 0 && (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                {t('No resources yet.')}
                            </p>
                        )}
                        {lesson.resources.map((resource) => (
                            <div
                                key={resource.id}
                                className="flex items-center justify-between gap-2 rounded-md bg-muted p-1.5"
                            >
                                <div className="w-full px-1 text-sm">
                                    {resource.url ? (
                                        <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="hover:underline"
                                        >
                                            {resource.title}
                                        </a>
                                    ) : (
                                        <span className="flex items-center gap-1.5">
                                            <FileText className="size-4 text-muted-foreground" />
                                            {resource.title}
                                        </span>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0 rounded-full"
                                            aria-label={t('Actions for :name', {
                                                name: resource.title,
                                            })}
                                        >
                                            <EllipsisVertical />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onSelect={() => remove(resource)}
                                        >
                                            <Trash2 />
                                            {t('Delete')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                ) : (
                    <form onSubmit={submit} className="space-y-4 p-0.5">
                        <div className="space-y-2">
                            <Label htmlFor="resource-title">{t('Title')}</Label>
                            <Input
                                id="resource-title"
                                required
                                value={data.title}
                                onChange={(event) =>
                                    setData('title', event.target.value)
                                }
                                placeholder={t('Enter title')}
                                aria-invalid={!!errors.title}
                            />
                            <InputError message={errors.title} />
                        </div>

                        <fieldset className="space-y-2">
                            <legend className="mb-2 text-sm font-medium">
                                {t('Resource type')}
                            </legend>
                            <div className="flex gap-6">
                                {(
                                    [
                                        ['link', t('Link')],
                                        ['file', t('File')],
                                    ] as const
                                ).map(([value, label]) => (
                                    <label
                                        key={value}
                                        className="flex cursor-pointer items-center gap-2 text-sm font-medium"
                                    >
                                        <input
                                            type="radio"
                                            name="resource-type"
                                            checked={data.type === value}
                                            onChange={() =>
                                                setData('type', value)
                                            }
                                            className="size-4 accent-primary"
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        {data.type === 'link' ? (
                            <div className="space-y-2">
                                <Label htmlFor="resource-url">{t('URL')}</Label>
                                <Input
                                    id="resource-url"
                                    type="url"
                                    required
                                    value={data.url}
                                    onChange={(event) =>
                                        setData('url', event.target.value)
                                    }
                                    placeholder="https://"
                                    aria-invalid={!!errors.url}
                                />
                                <InputError message={errors.url} />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="resource-file">
                                    {t('File')}
                                </Label>
                                <Input
                                    id="resource-file"
                                    type="file"
                                    required
                                    onChange={(event) =>
                                        setData(
                                            'file',
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                    className="cursor-pointer"
                                    aria-invalid={!!errors.file}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t(
                                        'PDF, Office, CSV, text, ZIP or image, up to 20 MB.',
                                    )}
                                </p>
                                <InputError message={errors.file} />
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit" disabled={form.processing}>
                                {form.processing && <Spinner />}
                                {t('Submit')}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
