import { router, useForm } from '@inertiajs/react';
import {
    ArrowDownUp,
    CircleCheck,
    Circle,
    EllipsisVertical,
    Pencil,
    Plus,
    Square,
    SquareCheck,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { SortDialog } from '@/components/admin/course-curriculum';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import questions from '@/routes/admin/exams/questions';

export type QuestionType =
    | 'multiple_choice'
    | 'multiple_select'
    | 'matching'
    | 'fill_blank'
    | 'ordering'
    | 'short_answer';

type Pair = { left: string; right: string };

export type ExamQuestion = {
    id: number;
    type: QuestionType;
    title: string;
    /** Sanitized HTML. */
    description: string | null;
    options: string[] | null;
    /** Shape depends on the type; see App\Enums\QuestionType. */
    answer: (number | string | Pair)[];
    marks: string;
};

/** Labels and badge colours per type, in the demo's order. */
const TYPES: Record<
    QuestionType,
    { label: string; tone: string; hint: string }
> = {
    multiple_choice: {
        label: 'Multiple choice',
        tone: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
        hint: 'Select the correct answer (students can select only one)',
    },
    multiple_select: {
        label: 'Multiple select',
        tone: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
        hint: 'Select every correct answer (students can select several)',
    },
    matching: {
        label: 'Matching',
        tone: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
        hint: 'Enter matching pairs; students see the right-hand side shuffled',
    },
    fill_blank: {
        label: 'Fill in the blank',
        tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
        hint: 'Write the blank as ____ in the title, and list every accepted answer',
    },
    ordering: {
        label: 'Ordering',
        tone: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
        hint: 'Enter the items in the correct order; students see them shuffled',
    },
    short_answer: {
        label: 'Short answer',
        tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
        hint: 'Marked by hand; the model answer guides the marker',
    },
};

const visit = { preserveScroll: true, preserveState: true };

/**
 * The exam editor's Questions tab, following the Mentor demo: a summary line, Reorder and Add Question,
 * and a card per question showing its type, marks and answer key.
 */
export type QuestionUrls = {
    store: string;
    update: (id: number) => string;
    destroy: (id: number) => string;
    sort: string;
};

/** The URLs for an exam's questions. */
export const examQuestionUrls = (examId: number): QuestionUrls => ({
    store: questions.store.url(examId),
    update: (id) => questions.update.url({ exam: examId, question: id }),
    destroy: (id) => questions.destroy.url({ exam: examId, question: id }),
    sort: questions.sort.url(examId),
});

export function ExamQuestions({
    urls,
    items,
}: {
    urls: QuestionUrls;
    items: ExamQuestion[];
}) {
    const { t } = useTranslation();
    const [editing, setEditing] = useState<ExamQuestion | 'new' | null>(null);
    const [deleting, setDeleting] = useState<ExamQuestion | null>(null);
    const [sorting, setSorting] = useState(false);
    const total = items.reduce((sum, item) => sum + Number(item.marks), 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-semibold">
                        {t('Exam questions')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {t(
                            items.length === 1
                                ? ':count question • Total: :marks marks'
                                : ':count questions • Total: :marks marks',
                            { count: items.length, marks: total.toFixed(2) },
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        disabled={items.length < 2}
                        onClick={() => setSorting(true)}
                    >
                        <ArrowDownUp />
                        {t('Reorder')}
                    </Button>
                    <Button onClick={() => setEditing('new')}>
                        <Plus />
                        {t('Add question')}
                    </Button>
                </div>
            </div>

            {items.length === 0 && (
                <Card className="items-center py-12 text-center text-muted-foreground">
                    {t('No questions yet. Add the first question.')}
                </Card>
            )}

            {items.map((item, index) => (
                <Card key={item.id} className="gap-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                                Q{index + 1}
                            </span>
                            <span
                                className={cn(
                                    'rounded-md px-2 py-0.5 text-xs font-medium',
                                    TYPES[item.type].tone,
                                )}
                            >
                                {t(TYPES[item.type].label)}
                            </span>
                            <span className="text-blue-600 dark:text-blue-400">
                                {t(':marks marks', {
                                    marks: Number(item.marks).toFixed(2),
                                })}
                            </span>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full"
                                    aria-label={t('Actions for :name', {
                                        name: `Q${index + 1}`,
                                    })}
                                >
                                    <EllipsisVertical />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onSelect={() => setEditing(item)}
                                >
                                    <Pencil />
                                    {t('Edit')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={() => setDeleting(item)}
                                >
                                    <Trash2 />
                                    {t('Delete')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <p className="text-base font-medium">{item.title}</p>
                    {item.description && (
                        <div
                            className="rich-text text-muted-foreground"
                            dangerouslySetInnerHTML={{
                                __html: item.description,
                            }}
                        />
                    )}
                    <AnswerKey question={item} />
                </Card>
            ))}

            {editing && (
                <QuestionDialog
                    urls={urls}
                    question={editing === 'new' ? undefined : editing}
                    onClose={() => setEditing(null)}
                />
            )}

            {sorting && (
                <SortDialog
                    title={t('Reorder questions')}
                    items={items.map((item, index) => ({
                        id: item.id,
                        title: `Q${index + 1}. ${item.title}`,
                    }))}
                    url={urls.sort}
                    onClose={() => setSorting(false)}
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
                                {t('Delete this question?')}
                            </DialogTitle>
                            <DialogDescription>
                                {deleting.title}
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
                                        urls.destroy(deleting.id),
                                        {
                                            ...visit,
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
        </div>
    );
}

/** The correct answer, shown under each question card. */
function AnswerKey({ question }: { question: ExamQuestion }) {
    const { t } = useTranslation();
    const { type, options, answer } = question;

    if (type === 'multiple_choice' || type === 'multiple_select') {
        const correct = new Set(answer as number[]);
        const [On, Off] =
            type === 'multiple_choice'
                ? [CircleCheck, Circle]
                : [SquareCheck, Square];

        return (
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {(options ?? []).map((option, index) => (
                    <li
                        key={index}
                        className={cn(
                            'flex items-center gap-2',
                            correct.has(index)
                                ? 'font-medium text-emerald-600 dark:text-emerald-400'
                                : 'text-muted-foreground',
                        )}
                    >
                        {correct.has(index) ? (
                            <On className="size-4" aria-label={t('Correct')} />
                        ) : (
                            <Off className="size-4" />
                        )}
                        {option}
                    </li>
                ))}
            </ul>
        );
    }

    if (type === 'matching') {
        return (
            <ul className="space-y-1 text-sm">
                {(answer as Pair[]).map((pair, index) => (
                    <li key={index} className="flex gap-2">
                        <span className="font-medium">{pair.left}</span>
                        <span className="text-muted-foreground">→</span>
                        <span>{pair.right}</span>
                    </li>
                ))}
            </ul>
        );
    }

    if (type === 'ordering') {
        return (
            <ol className="list-decimal space-y-1 ps-5 text-sm">
                {(answer as string[]).map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ol>
        );
    }

    return (
        <p className="text-sm">
            <span className="text-muted-foreground">
                {type === 'fill_blank'
                    ? t('Accepted answers:')
                    : t('Model answer:')}{' '}
            </span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {(answer as string[]).join(' / ')}
            </span>
        </p>
    );
}

type QuestionFormData = {
    type: QuestionType;
    marks: string;
    title: string;
    description: string;
    options: string[];
    /** Indexes for choice questions, strings for text lists, pairs for matching. */
    answer: (number | string | Pair)[];
};

/** A sensible empty answer for each type. */
const blankFor = (
    type: QuestionType,
): Pick<QuestionFormData, 'options' | 'answer'> => {
    switch (type) {
        case 'multiple_choice':
        case 'multiple_select':
            return { options: ['', ''], answer: [] };
        case 'matching':
            return {
                options: [],
                answer: [
                    { left: '', right: '' },
                    { left: '', right: '' },
                ],
            };
        case 'ordering':
            return { options: [], answer: ['', ''] };
        default:
            return { options: [], answer: [''] };
    }
};

function QuestionDialog({
    urls,
    question,
    onClose,
}: {
    urls: QuestionUrls;
    question?: ExamQuestion;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const form = useForm<QuestionFormData>({
        type: question?.type ?? 'multiple_choice',
        marks: question ? String(Number(question.marks)) : '1',
        title: question?.title ?? '',
        description: question?.description ?? '',
        options: question?.options ?? blankFor('multiple_choice').options,
        answer: question?.answer ?? [],
    });
    const { data, setData, errors } = form;
    const isChoice =
        data.type === 'multiple_choice' || data.type === 'multiple_select';
    const allErrors = errors as Record<string, string | undefined>;
    const answerError =
        allErrors.answer ??
        Object.entries(allErrors).find(([key]) =>
            key.startsWith('answer.'),
        )?.[1];
    const optionsError =
        allErrors.options ??
        Object.entries(allErrors).find(([key]) =>
            key.startsWith('options.'),
        )?.[1];

    const changeType = (type: QuestionType) =>
        setData((current) => ({ ...current, type, ...blankFor(type) }));

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = { ...visit, onSuccess: onClose };

        if (question) {
            form.put(urls.update(question.id), options);
        } else {
            form.post(urls.store, options);
        }
    };

    const toggleCorrect = (index: number) => {
        if (data.type === 'multiple_choice') {
            setData('answer', [index]);

            return;
        }

        const current = data.answer as number[];
        setData(
            'answer',
            current.includes(index)
                ? current.filter((value) => value !== index)
                : [...current, index],
        );
    };

    const removeOption = (index: number) =>
        setData((current) => ({
            ...current,
            options: current.options.filter((_, i) => i !== index),
            // Keep the correct marks pointing at the same options.
            answer: (current.answer as number[])
                .filter((value) => value !== index)
                .map((value) => (value > index ? value - 1 : value)),
        }));

    const textList = data.answer as string[];
    const pairs = data.answer as Pair[];

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader className="mb-2">
                    <DialogTitle>
                        {question ? t('Update question') : t('Create question')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="min-w-0 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="question-type">
                                {t('Question type')} *
                            </Label>
                            <Select
                                value={data.type}
                                onValueChange={(value) =>
                                    changeType(value as QuestionType)
                                }
                            >
                                <SelectTrigger
                                    id="question-type"
                                    className="w-full data-[size=default]:h-10"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(TYPES) as QuestionType[]).map(
                                        (type) => (
                                            <SelectItem key={type} value={type}>
                                                {t(TYPES[type].label)}
                                            </SelectItem>
                                        ),
                                    )}
                                    <SelectItem value="listening" disabled>
                                        {t('Listening')} · {t('Soon')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="question-marks">
                                {t('Marks')} *
                            </Label>
                            <Input
                                id="question-marks"
                                type="number"
                                min="0.25"
                                step="0.25"
                                required
                                value={data.marks}
                                onChange={(event) =>
                                    setData('marks', event.target.value)
                                }
                                aria-invalid={!!errors.marks}
                                className="h-10"
                            />
                            <InputError message={errors.marks} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="question-title">
                            {t('Question title')} *
                        </Label>
                        <Input
                            id="question-title"
                            required
                            value={data.title}
                            onChange={(event) =>
                                setData('title', event.target.value)
                            }
                            aria-invalid={!!errors.title}
                            className="h-10"
                        />
                        <InputError message={errors.title} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="question-description">
                            {t('Description (optional)')}
                        </Label>
                        <RichTextEditor
                            id="question-description"
                            value={data.description}
                            onChange={(html) => setData('description', html)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>
                            {isChoice
                                ? t('Answer options')
                                : data.type === 'matching'
                                  ? t('Matching pairs')
                                  : data.type === 'ordering'
                                    ? t('Items in the correct order')
                                    : data.type === 'fill_blank'
                                      ? t('Accepted answers')
                                      : t('Model answer')}{' '}
                            *
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            {t(TYPES[data.type].hint)}
                        </p>

                        {isChoice &&
                            data.options.map((option, index) => {
                                const correct = (
                                    data.answer as number[]
                                ).includes(index);

                                return (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2"
                                    >
                                        <input
                                            type={
                                                data.type === 'multiple_choice'
                                                    ? 'radio'
                                                    : 'checkbox'
                                            }
                                            name="correct"
                                            checked={correct}
                                            onChange={() =>
                                                toggleCorrect(index)
                                            }
                                            aria-label={t(
                                                'Mark option :number as correct',
                                                { number: index + 1 },
                                            )}
                                            className="size-4 shrink-0 accent-emerald-600"
                                        />
                                        <Input
                                            value={option}
                                            required
                                            onChange={(event) =>
                                                setData(
                                                    'options',
                                                    data.options.map(
                                                        (value, i) =>
                                                            i === index
                                                                ? event.target
                                                                      .value
                                                                : value,
                                                    ),
                                                )
                                            }
                                            placeholder={t('Option :number', {
                                                number: index + 1,
                                            })}
                                            className="h-9"
                                        />
                                        <RemoveButton
                                            disabled={data.options.length <= 2}
                                            onClick={() => removeOption(index)}
                                        />
                                    </div>
                                );
                            })}

                        {data.type === 'matching' &&
                            pairs.map((pair, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2"
                                >
                                    {(['left', 'right'] as const).map(
                                        (side) => (
                                            <Input
                                                key={side}
                                                value={pair[side]}
                                                required
                                                onChange={(event) =>
                                                    setData(
                                                        'answer',
                                                        pairs.map((value, i) =>
                                                            i === index
                                                                ? {
                                                                      ...value,
                                                                      [side]: event
                                                                          .target
                                                                          .value,
                                                                  }
                                                                : value,
                                                        ),
                                                    )
                                                }
                                                placeholder={
                                                    side === 'left'
                                                        ? t('Term')
                                                        : t('Match')
                                                }
                                                className="h-9"
                                            />
                                        ),
                                    )}
                                    <RemoveButton
                                        disabled={pairs.length <= 2}
                                        onClick={() =>
                                            setData(
                                                'answer',
                                                pairs.filter(
                                                    (_, i) => i !== index,
                                                ),
                                            )
                                        }
                                    />
                                </div>
                            ))}

                        {!isChoice &&
                            data.type !== 'matching' &&
                            textList.map((value, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-2"
                                >
                                    {data.type === 'ordering' && (
                                        <span className="w-5 pt-2 text-sm text-muted-foreground tabular-nums">
                                            {index + 1}.
                                        </span>
                                    )}
                                    {data.type === 'short_answer' ? (
                                        <Textarea
                                            value={value}
                                            required
                                            onChange={(event) =>
                                                setData('answer', [
                                                    event.target.value,
                                                ])
                                            }
                                            className="min-h-24"
                                        />
                                    ) : (
                                        <Input
                                            value={value}
                                            required
                                            onChange={(event) =>
                                                setData(
                                                    'answer',
                                                    textList.map((item, i) =>
                                                        i === index
                                                            ? event.target.value
                                                            : item,
                                                    ),
                                                )
                                            }
                                            className="h-9"
                                        />
                                    )}
                                    {data.type !== 'short_answer' && (
                                        <RemoveButton
                                            disabled={
                                                textList.length <=
                                                (data.type === 'ordering'
                                                    ? 2
                                                    : 1)
                                            }
                                            onClick={() =>
                                                setData(
                                                    'answer',
                                                    textList.filter(
                                                        (_, i) => i !== index,
                                                    ),
                                                )
                                            }
                                        />
                                    )}
                                </div>
                            ))}

                        {data.type !== 'short_answer' && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    isChoice
                                        ? setData('options', [
                                              ...data.options,
                                              '',
                                          ])
                                        : data.type === 'matching'
                                          ? setData('answer', [
                                                ...pairs,
                                                { left: '', right: '' },
                                            ])
                                          : setData('answer', [...textList, ''])
                                }
                            >
                                <Plus />
                                {isChoice
                                    ? t('Add option')
                                    : data.type === 'matching'
                                      ? t('Add pair')
                                      : t('Add item')}
                            </Button>
                        )}

                        {isChoice && (data.answer as number[]).length === 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                {t(
                                    'Please mark at least one option as correct',
                                )}
                            </p>
                        )}
                        <InputError message={answerError ?? optionsError} />
                    </div>

                    <DialogFooter className="pt-2">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                {t('Cancel')}
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner />}
                            {question
                                ? t('Save changes')
                                : t('Create question')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RemoveButton({
    disabled,
    onClick,
}: {
    disabled: boolean;
    onClick: () => void;
}) {
    const { t } = useTranslation();

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            disabled={disabled}
            aria-label={t('Remove')}
            onClick={onClick}
        >
            <X />
        </Button>
    );
}
