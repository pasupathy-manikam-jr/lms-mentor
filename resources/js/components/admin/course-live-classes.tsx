import { router, useForm } from '@inertiajs/react';
import {
    Calendar,
    EllipsisVertical,
    ExternalLink,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import liveClasses from '@/routes/admin/courses/live-classes';

export type LiveClassItem = {
    id: number;
    topic: string;
    /** ISO 8601 in UTC; shown in the viewer's own time zone. */
    starts_at: string;
    duration_minutes: number;
    meeting_url: string;
    notes: string | null;
    status: 'upcoming' | 'live' | 'ended';
};

const STATUS_VARIANT = {
    upcoming: 'secondary',
    live: 'default',
    ended: 'outline',
} as const;

const STATUS_LABEL = { upcoming: 'Upcoming', live: 'Live now', ended: 'Ended' };

/** A date as the value of a datetime-local input, in the viewer's time zone. */
const toLocalInput = (iso: string) => {
    const date = new Date(iso);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

    return date.toISOString().slice(0, 16);
};

export function useLiveClassDate() {
    const { intlLocale } = useTranslation();

    return (iso: string) =>
        new Date(iso).toLocaleString(intlLocale, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
}

/**
 * The editor's Live class tab, following the demo: a Schedule Class button, the scheduled classes, and
 * an empty state. Classes are joined through the meeting link given when scheduling.
 */
export function CourseLiveClasses({
    courseId,
    classes,
}: {
    courseId: number;
    classes: LiveClassItem[];
}) {
    const { t } = useTranslation();
    const formatDate = useLiveClassDate();
    const [editing, setEditing] = useState<LiveClassItem | 'new' | null>(null);
    const [deleting, setDeleting] = useState<LiveClassItem | null>(null);

    return (
        <Card className="p-4 sm:p-6">
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-bold">{t('Live classes')}</h2>
                    <Button onClick={() => setEditing('new')}>
                        <Plus />
                        {t('Schedule class')}
                    </Button>
                </div>

                {classes.length === 0 ? (
                    <div className="p-8 text-center">
                        <Calendar className="mx-auto mb-4 size-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-medium">
                            {t('No live classes scheduled')}
                        </h3>
                        <p className="text-muted-foreground">
                            {t(
                                'Schedule your first live class and share its meeting link with learners.',
                            )}
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {classes.map((liveClass) => (
                            <li
                                key={liveClass.id}
                                className="flex items-start justify-between gap-4 rounded-lg border px-4 py-3"
                            >
                                <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium">
                                            {liveClass.topic}
                                        </p>
                                        <Badge
                                            variant={
                                                STATUS_VARIANT[liveClass.status]
                                            }
                                        >
                                            {t(STATUS_LABEL[liveClass.status])}
                                        </Badge>
                                    </div>
                                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="size-3.5" />
                                            {formatDate(liveClass.starts_at)}
                                        </span>
                                    </p>
                                    {liveClass.notes && (
                                        <p className="text-sm whitespace-pre-line text-muted-foreground">
                                            {liveClass.notes}
                                        </p>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0 rounded-full"
                                            aria-label={t('Actions for :name', {
                                                name: liveClass.topic,
                                            })}
                                        >
                                            <EllipsisVertical />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <a
                                                href={liveClass.meeting_url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <ExternalLink />
                                                {t('Join class')}
                                            </a>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={() =>
                                                setEditing(liveClass)
                                            }
                                        >
                                            <Pencil />
                                            {t('Edit')}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onSelect={() =>
                                                setDeleting(liveClass)
                                            }
                                        >
                                            <Trash2 />
                                            {t('Delete')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {editing && (
                <LiveClassDialog
                    courseId={courseId}
                    liveClass={editing === 'new' ? undefined : editing}
                    onClose={() => setEditing(null)}
                />
            )}

            {deleting && (
                <Dialog
                    open
                    onOpenChange={(open) => !open && setDeleting(null)}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {t('Delete this live class?')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('":name" will be deleted.', {
                                    name: deleting.topic,
                                })}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">{t('Cancel')}</Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                onClick={() =>
                                    router.delete(
                                        liveClasses.destroy.url({
                                            course: courseId,
                                            liveClass: deleting.id,
                                        }),
                                        {
                                            preserveScroll: true,
                                            preserveState: true,
                                            onSuccess: () => setDeleting(null),
                                        },
                                    )
                                }
                            >
                                {t('Delete')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </Card>
    );
}

function LiveClassDialog({
    courseId,
    liveClass,
    onClose,
}: {
    courseId: number;
    liveClass?: LiveClassItem;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const form = useForm({
        topic: liveClass?.topic ?? '',
        // New classes start pre-filled with the current time, like the demo.
        starts_at: toLocalInput(
            liveClass?.starts_at ?? new Date().toISOString(),
        ),
        meeting_url: liveClass?.meeting_url ?? '',
        notes: liveClass?.notes ?? '',
    });
    const { data, setData, errors } = form;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        // Send the time with the browser's offset, so the server can store it in UTC.
        form.transform((values) => ({
            ...values,
            starts_at: values.starts_at
                ? new Date(values.starts_at).toISOString()
                : '',
        }));
        const options = {
            preserveScroll: true,
            preserveState: true,
            onSuccess: onClose,
        };

        if (liveClass) {
            form.put(
                liveClasses.update.url({
                    course: courseId,
                    liveClass: liveClass.id,
                }),
                options,
            );
        } else {
            form.post(liveClasses.store.url(courseId), options);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {liveClass ? t('Edit live class') : t('Schedule class')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4 p-0.5">
                    <div className="space-y-2">
                        <Label htmlFor="live-topic">{t('Class topic')} *</Label>
                        <Input
                            id="live-topic"
                            required
                            value={data.topic}
                            onChange={(event) =>
                                setData('topic', event.target.value)
                            }
                            placeholder={t('Class topic')}
                            aria-invalid={!!errors.topic}
                            autoFocus
                        />
                        <InputError message={errors.topic} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="live-start">
                            {t('Start date & time')} *
                        </Label>
                        <Input
                            id="live-start"
                            type="datetime-local"
                            required
                            value={data.starts_at}
                            onChange={(event) =>
                                setData('starts_at', event.target.value)
                            }
                            aria-invalid={!!errors.starts_at}
                        />
                        <InputError message={errors.starts_at} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="live-url">{t('Meeting link')} *</Label>
                        <Input
                            id="live-url"
                            type="url"
                            required
                            value={data.meeting_url}
                            onChange={(event) =>
                                setData('meeting_url', event.target.value)
                            }
                            placeholder="https://zoom.us/j/…"
                            aria-invalid={!!errors.meeting_url}
                        />
                        <p className="text-xs text-muted-foreground">
                            {t('A Zoom, Google Meet or Microsoft Teams link.')}
                        </p>
                        <InputError message={errors.meeting_url} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="live-notes">
                            {t('Class notes (optional)')}
                        </Label>
                        <Textarea
                            id="live-notes"
                            rows={10}
                            value={data.notes}
                            onChange={(event) =>
                                setData('notes', event.target.value)
                            }
                            aria-invalid={!!errors.notes}
                            className="min-h-64"
                        />
                        <InputError message={errors.notes} />
                    </div>
                    <DialogFooter className="pt-2">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                {t('Cancel')}
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner />}
                            {liveClass
                                ? t('Save changes')
                                : t('Schedule class')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
