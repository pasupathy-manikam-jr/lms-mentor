import { router, useForm } from '@inertiajs/react';
import {
    ArrowUpDown,
    ChevronDown,
    Clock,
    EllipsisVertical,
    ListChecks,
    Move,
    Paperclip,
    Pencil,
    Plus,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { LessonFormDialog } from '@/components/admin/lesson-form-dialog';
import type { EditableLesson } from '@/components/admin/lesson-form-dialog';
import { LessonResourcesDialog } from '@/components/admin/lesson-resources-dialog';
import type { LessonResource } from '@/components/admin/lesson-resources-dialog';
import { QuizFormDialog } from '@/components/admin/quiz-form-dialog';
import type { EditableQuiz } from '@/components/admin/quiz-form-dialog';
import InputError from '@/components/input-error';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
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
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import lessons from '@/routes/admin/courses/lessons';
import sections from '@/routes/admin/courses/sections';

export type CurriculumLesson = EditableLesson &
    EditableQuiz & {
        type: 'lesson' | 'quiz';
        resources: LessonResource[];
    };

export type CurriculumSection = {
    id: number;
    title: string;
    lessons: CurriculumLesson[];
};

/** Which dialog is open; each carries the record it acts on. */
type Dialogs =
    | { kind: 'section'; section?: CurriculumSection }
    | {
          kind: 'lesson';
          type: CurriculumLesson['type'];
          section: CurriculumSection;
          lesson?: CurriculumLesson;
      }
    | { kind: 'sort' }
    | { kind: 'sort-lessons'; section: CurriculumSection }
    | { kind: 'delete-section'; section: CurriculumSection }
    | { kind: 'delete-lesson'; lesson: CurriculumLesson }
    | { kind: 'resources'; lessonId: number };

const visit = { preserveScroll: true, preserveState: true };

/**
 * The Curriculum tab: sections as an accordion, each with its lessons, plus dialogs to add, edit,
 * delete and reorder them.
 */
export function CourseCurriculum({
    courseId,
    sections: courseSections,
}: {
    courseId: number;
    sections: CurriculumSection[];
}) {
    const { t } = useTranslation();
    const [dialog, setDialog] = useState<Dialogs | null>(null);
    const close = () => setDialog(null);
    // Read from the latest props so resources appear as soon as they are saved.
    const resourceLesson =
        dialog?.kind === 'resources'
            ? courseSections
                  .flatMap((section) => section.lessons)
                  .find((lesson) => lesson.id === dialog.lessonId)
            : undefined;

    return (
        <Card className="gap-0 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-end gap-4">
                <Button
                    variant="secondary"
                    onClick={() => setDialog({ kind: 'section' })}
                >
                    {t('Add section')}
                </Button>
                <Button
                    variant="secondary"
                    disabled={courseSections.length < 2}
                    onClick={() => setDialog({ kind: 'sort' })}
                >
                    {t('Sort sections')}
                </Button>
            </div>
            <Separator className="my-5" />

            {courseSections.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                    {t(
                        'No sections yet. Add a section, then add lessons to it.',
                    )}
                </p>
            ) : (
                <Accordion
                    type="multiple"
                    defaultValue={[String(courseSections[0].id)]}
                    className="space-y-4"
                >
                    {courseSections.map((section, index) => (
                        <AccordionItem
                            key={section.id}
                            value={String(section.id)}
                            className="overflow-hidden rounded-lg border last:border-b"
                        >
                            <div className="flex items-center gap-2 pe-3 has-[[data-state=open]]:bg-muted [&>h3]:min-w-0 [&>h3]:flex-1">
                                <AccordionTrigger className="px-4 py-3 text-base hover:no-underline [&>svg]:hidden">
                                    {index + 1}. {section.title}
                                </AccordionTrigger>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="shrink-0"
                                        >
                                            {t('Section menu')}
                                            <ChevronDown />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-52"
                                    >
                                        <DropdownMenuItem
                                            onSelect={() =>
                                                setDialog({
                                                    kind: 'lesson',
                                                    type: 'lesson',
                                                    section,
                                                })
                                            }
                                        >
                                            <Plus />
                                            {t('Add lesson')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            disabled={
                                                section.lessons.length < 2
                                            }
                                            onSelect={() =>
                                                setDialog({
                                                    kind: 'sort-lessons',
                                                    section,
                                                })
                                            }
                                        >
                                            <ArrowUpDown />
                                            {t('Sort lessons')}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={() =>
                                                setDialog({
                                                    kind: 'lesson',
                                                    type: 'quiz',
                                                    section,
                                                })
                                            }
                                        >
                                            <ListChecks />
                                            {t('Add quiz')}
                                        </DropdownMenuItem>
                                        <AiMenuItem label={t('Quiz with AI')} />
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onSelect={() =>
                                                setDialog({
                                                    kind: 'section',
                                                    section,
                                                })
                                            }
                                        >
                                            <Pencil />
                                            {t('Update section')}
                                        </DropdownMenuItem>
                                        <AiMenuItem
                                            label={t('Update with AI')}
                                        />
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onSelect={() =>
                                                setDialog({
                                                    kind: 'delete-section',
                                                    section,
                                                })
                                            }
                                        >
                                            <Trash2 />
                                            {t('Delete section')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <AccordionContent className="space-y-4 p-4">
                                {section.lessons.length === 0 && (
                                    <p className="text-muted-foreground">
                                        {t('No lessons in this section yet.')}
                                    </p>
                                )}
                                {section.lessons.map((lesson) => (
                                    <div
                                        key={lesson.id}
                                        className="flex w-full items-center justify-between gap-4 rounded-md border px-4 py-3"
                                    >
                                        <p className="flex min-w-0 items-center gap-2">
                                            {lesson.type === 'quiz' && (
                                                <Badge variant="secondary">
                                                    {t('Quiz')}
                                                </Badge>
                                            )}
                                            <span className="truncate">
                                                {lesson.title}
                                            </span>
                                        </p>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                                                <Clock className="size-3.5" />
                                                {t(':count min', {
                                                    count: lesson.duration_minutes,
                                                })}
                                            </span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full"
                                                        aria-label={t(
                                                            'Actions for :name',
                                                            {
                                                                name: lesson.title,
                                                            },
                                                        )}
                                                    >
                                                        <EllipsisVertical />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {lesson.type ===
                                                        'lesson' && (
                                                        <DropdownMenuItem
                                                            onSelect={() =>
                                                                setDialog({
                                                                    kind: 'resources',
                                                                    lessonId:
                                                                        lesson.id,
                                                                })
                                                            }
                                                        >
                                                            <Paperclip />
                                                            {t('Resource')}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            setDialog({
                                                                kind: 'lesson',
                                                                type: lesson.type,
                                                                section,
                                                                lesson,
                                                            })
                                                        }
                                                    >
                                                        <Pencil />
                                                        {t('Edit')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onSelect={() =>
                                                            setDialog({
                                                                kind: 'delete-lesson',
                                                                lesson,
                                                            })
                                                        }
                                                    >
                                                        <Trash2 />
                                                        {t('Delete')}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}

            {dialog?.kind === 'section' && (
                <SectionDialog
                    courseId={courseId}
                    section={dialog.section}
                    onClose={close}
                />
            )}
            {dialog?.kind === 'lesson' && dialog.type === 'lesson' && (
                <LessonFormDialog
                    courseId={courseId}
                    sectionId={dialog.section.id}
                    sectionTitle={dialog.section.title}
                    lesson={dialog.lesson}
                    onClose={close}
                />
            )}
            {dialog?.kind === 'lesson' && dialog.type === 'quiz' && (
                <QuizFormDialog
                    courseId={courseId}
                    sectionId={dialog.section.id}
                    sectionTitle={dialog.section.title}
                    quiz={dialog.lesson}
                    onClose={close}
                />
            )}
            {dialog?.kind === 'resources' && resourceLesson && (
                <LessonResourcesDialog
                    courseId={courseId}
                    lesson={resourceLesson}
                    onClose={close}
                />
            )}
            {dialog?.kind === 'sort' && (
                <SortDialog
                    title={t('Sort sections')}
                    items={courseSections}
                    url={sections.sort.url(courseId)}
                    onClose={close}
                />
            )}
            {dialog?.kind === 'sort-lessons' && (
                <SortDialog
                    title={t('Sort items')}
                    items={dialog.section.lessons}
                    url={lessons.sort.url({
                        course: courseId,
                        section: dialog.section.id,
                    })}
                    onClose={close}
                />
            )}
            {dialog?.kind === 'delete-section' && (
                <ConfirmDeleteDialog
                    title={t('Delete this section?')}
                    description={t(
                        '":name" and all of its lessons and quizzes will be deleted.',
                        { name: dialog.section.title },
                    )}
                    onConfirm={() =>
                        router.delete(
                            sections.destroy.url({
                                course: courseId,
                                section: dialog.section.id,
                            }),
                            { ...visit, onSuccess: close },
                        )
                    }
                    onClose={close}
                />
            )}
            {dialog?.kind === 'delete-lesson' && (
                <ConfirmDeleteDialog
                    title={t('Delete this lesson?')}
                    description={t('":name" will be deleted.', {
                        name: dialog.lesson.title,
                    })}
                    onConfirm={() =>
                        router.delete(
                            lessons.destroy.url({
                                course: courseId,
                                lesson: dialog.lesson.id,
                            }),
                            { ...visit, onSuccess: close },
                        )
                    }
                    onClose={close}
                />
            )}
        </Card>
    );
}

function SectionDialog({
    courseId,
    section,
    onClose,
}: {
    courseId: number;
    section?: CurriculumSection;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const form = useForm({ title: section?.title ?? '' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = { ...visit, onSuccess: onClose };

        if (section) {
            form.put(
                sections.update.url({ course: courseId, section: section.id }),
                options,
            );
        } else {
            form.post(sections.store.url(courseId), options);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>
                            {section ? t('Update section') : t('Add section')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="section-title">
                            {t('Section title')}
                        </Label>
                        <Input
                            id="section-title"
                            value={form.data.title}
                            onChange={(event) =>
                                form.setData('title', event.target.value)
                            }
                            placeholder={t('Enter your section title')}
                            aria-invalid={!!form.errors.title}
                            required
                            autoFocus
                        />
                        <InputError message={form.errors.title} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                {t('Close')}
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            {t('Submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/**
 * The demo's Sort dialog: drag rows by the move handle to reorder them; each change is saved at once.
 * The handle also works from the keyboard with the up and down arrow keys.
 */
export function SortDialog({
    title,
    items: initial,
    url,
    onClose,
}: {
    title: string;
    items: { id: number; title: string }[];
    url: string;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const [order, setOrder] = useState(initial);
    const [dragging, setDragging] = useState<number | null>(null);

    const save = (next: typeof order) =>
        router.put(url, { ids: next.map((item) => item.id) }, visit);

    const moved = (from: number, to: number) => {
        const next = [...order];
        next.splice(to, 0, ...next.splice(from, 1));

        return next;
    };

    const moveByKey = (index: number, key: string) => {
        const to = key === 'ArrowUp' ? index - 1 : index + 1;

        if (to < 0 || to >= order.length) {
            return;
        }

        const next = moved(index, to);
        setOrder(next);
        save(next);
        // Keep focus on the moved item's handle so it can keep moving.
        requestAnimationFrame(() =>
            document
                .querySelector<HTMLElement>(
                    `[data-sort-handle="${next[to].id}"]`,
                )
                ?.focus(),
        );
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
                <DialogHeader className="mb-2">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="sr-only">
                        {t(
                            'Drag items to reorder them. The new order is saved automatically.',
                        )}
                    </DialogDescription>
                </DialogHeader>
                <ol className="space-y-2">
                    {order.map((item, index) => (
                        <li
                            key={item.id}
                            draggable
                            onDragStart={(event) => {
                                event.dataTransfer.effectAllowed = 'move';
                                setDragging(index);
                            }}
                            onDragOver={(event) => {
                                event.preventDefault();

                                if (dragging !== null && dragging !== index) {
                                    setOrder(moved(dragging, index));
                                    setDragging(index);
                                }
                            }}
                            onDragEnd={() => {
                                setDragging(null);

                                if (
                                    order.some(
                                        (entry, i) =>
                                            entry.id !== initial[i]?.id,
                                    )
                                ) {
                                    save(order);
                                }
                            }}
                            className={cn(
                                'flex items-center',
                                dragging === index && 'opacity-50',
                            )}
                        >
                            <button
                                type="button"
                                data-sort-handle={item.id}
                                aria-label={t('Move :name', {
                                    name: item.title,
                                })}
                                aria-describedby="sort-help"
                                onKeyDown={(event) => {
                                    if (
                                        event.key === 'ArrowUp' ||
                                        event.key === 'ArrowDown'
                                    ) {
                                        event.preventDefault();
                                        moveByKey(index, event.key);
                                    }
                                }}
                                className="me-4 cursor-grab rounded-sm text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
                            >
                                <Move className="size-5" />
                            </button>
                            <Card className="w-full gap-0 px-4 py-3 shadow-xs">
                                <p>{item.title}</p>
                            </Card>
                        </li>
                    ))}
                </ol>
                <p id="sort-help" className="sr-only">
                    {t('Use the up and down arrow keys to move this item.')}
                </p>
            </DialogContent>
        </Dialog>
    );
}

/**
 * The demo's AI actions. No AI service is connected yet, so they are shown disabled.
 */
function AiMenuItem({ label }: { label: string }) {
    const { t } = useTranslation();

    return (
        <DropdownMenuItem disabled>
            <Sparkles />
            {label}
            <span className="ms-auto text-xs">{t('Soon')}</span>
        </DropdownMenuItem>
    );
}

function ConfirmDeleteDialog({
    title,
    description,
    onConfirm,
    onClose,
}: {
    title: string;
    description: string;
    onConfirm: () => void;
    onClose: () => void;
}) {
    const { t } = useTranslation();

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{t('Cancel')}</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={onConfirm}>
                        {t('Delete')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
