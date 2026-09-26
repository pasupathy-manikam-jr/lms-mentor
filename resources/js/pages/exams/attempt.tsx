import { Head, router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Clock, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import attemptRoutes from '@/routes/exams/attempts';

type Question = {
    id: number;
    type:
        | 'multiple_choice'
        | 'multiple_select'
        | 'fill_blank'
        | 'ordering'
        | 'matching'
        | 'short_answer';
    title: string;
    description: string | null;
    marks: number;
    options: string[] | null;
    items: string[] | null;
    left: string[] | null;
    right: string[] | null;
};

type Answer = number | number[] | string | string[] | undefined;

/**
 * Taking an exam: every question on one page, a countdown, and the answers submitted when the student
 * is done or the time runs out. Answers are kept in this browser so a reload doesn't lose them.
 */
export default function ExamAttempt({
    attempt,
    exam,
    questions,
}: {
    attempt: {
        id: number;
        answers: Record<string, Answer> | null;
        ends_at: string;
    };
    exam: { title: string; pass_label: string; back_url: string };
    questions: Question[];
}) {
    const { t } = useTranslation();
    const storageKey = `exam-attempt-${attempt.id}`;
    const [answers, setAnswers] = useState<Record<string, Answer>>(() => {
        try {
            const saved = localStorage.getItem(storageKey);

            if (saved) {
                return JSON.parse(saved);
            }
        } catch {
            // Storage can be unavailable (private mode); start empty.
        }

        return attempt.answers ?? {};
    });
    const [remaining, setRemaining] = useState(() =>
        Math.max(
            0,
            Math.floor((Date.parse(attempt.ends_at) - Date.now()) / 1000),
        ),
    );
    const [confirming, setConfirming] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const submitted = useRef(false);

    const answeredCount = questions.filter((question) => {
        const value = answers[question.id];

        return Array.isArray(value)
            ? value.length > 0
            : value !== undefined && value !== '';
    }).length;

    const submit = () => {
        if (submitted.current) {
            return;
        }

        submitted.current = true;
        router.post(
            attemptRoutes.submit.url(attempt.id),
            { answers },
            {
                onStart: () => setSubmitting(true),
                onSuccess: () => {
                    try {
                        localStorage.removeItem(storageKey);
                    } catch {
                        // Nothing to clean up.
                    }
                },
                onError: () => {
                    submitted.current = false;
                    setSubmitting(false);
                },
            },
        );
    };

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(answers));
        } catch {
            // Storage can be unavailable; answers still submit.
        }
    }, [answers, storageKey]);

    useEffect(() => {
        const timer = setInterval(() => {
            const left = Math.max(
                0,
                Math.floor((Date.parse(attempt.ends_at) - Date.now()) / 1000),
            );
            setRemaining(left);

            if (left === 0) {
                clearInterval(timer);
                submit();
            }
        }, 1000);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attempt.ends_at]);

    const setAnswer = (id: number, value: Answer) =>
        setAnswers((current) => ({ ...current, [id]: value }));

    const minutes = Math.floor(remaining / 60);
    const seconds = String(remaining % 60).padStart(2, '0');

    return (
        <>
            <Head title={exam.title} />
            <div className="min-h-screen bg-muted/40">
                <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
                    <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
                        <div className="min-w-0">
                            <p className="truncate font-semibold">
                                {exam.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {t(':answered of :total answered', {
                                    answered: String(answeredCount),
                                    total: String(questions.length),
                                })}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge
                                variant={
                                    remaining < 60 ? 'destructive' : 'secondary'
                                }
                                className="gap-1 px-3 py-1 text-sm tabular-nums"
                                role="timer"
                                aria-live="off"
                            >
                                <Clock className="size-4" />
                                {minutes}:{seconds}
                            </Badge>
                            <Button
                                onClick={() => setConfirming(true)}
                                disabled={submitting}
                            >
                                {submitting ? <Spinner /> : <Send />}
                                {t('Submit')}
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
                    {questions.map((question, index) => (
                        <Card key={question.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-3">
                                    <CardTitle className="text-base leading-snug">
                                        {index + 1}. {question.title}
                                    </CardTitle>
                                    <Badge
                                        variant="outline"
                                        className="shrink-0"
                                    >
                                        {t(':count marks', {
                                            count: String(question.marks),
                                        })}
                                    </Badge>
                                </div>
                                {question.description && (
                                    <div
                                        className="rich-text text-sm text-muted-foreground"
                                        dangerouslySetInnerHTML={{
                                            __html: question.description,
                                        }}
                                    />
                                )}
                            </CardHeader>
                            <CardContent>
                                <QuestionInput
                                    question={question}
                                    value={answers[question.id]}
                                    onChange={(value) =>
                                        setAnswer(question.id, value)
                                    }
                                />
                            </CardContent>
                        </Card>
                    ))}
                </main>
            </div>

            {confirming && (
                <Dialog
                    open
                    onOpenChange={(open) => !open && setConfirming(false)}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {t('Submit your answers?')}
                            </DialogTitle>
                            <DialogDescription>
                                {answeredCount < questions.length
                                    ? t(
                                          ':count questions are not answered yet. You cannot change your answers after submitting.',
                                          {
                                              count: String(
                                                  questions.length -
                                                      answeredCount,
                                              ),
                                          },
                                      )
                                    : t(
                                          'You cannot change your answers after submitting.',
                                      )}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">
                                    {t('Keep going')}
                                </Button>
                            </DialogClose>
                            <Button onClick={submit} disabled={submitting}>
                                {submitting && <Spinner />}
                                {t('Submit')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

function QuestionInput({
    question,
    value,
    onChange,
}: {
    question: Question;
    value: Answer;
    onChange: (value: Answer) => void;
}) {
    const { t } = useTranslation();

    switch (question.type) {
        case 'multiple_choice':
            return (
                <div role="radiogroup" className="space-y-2">
                    {question.options?.map((option, i) => (
                        <label
                            key={i}
                            className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm',
                                value === i && 'border-primary bg-muted',
                            )}
                        >
                            <input
                                type="radio"
                                name={`q-${question.id}`}
                                checked={value === i}
                                onChange={() => onChange(i)}
                                className="size-4 accent-primary"
                            />
                            {option}
                        </label>
                    ))}
                </div>
            );
        case 'multiple_select': {
            const chosen = Array.isArray(value) ? (value as number[]) : [];

            return (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        {t('Choose every correct answer.')}
                    </p>
                    {question.options?.map((option, i) => (
                        <label
                            key={i}
                            className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm',
                                chosen.includes(i) && 'border-primary bg-muted',
                            )}
                        >
                            <Checkbox
                                checked={chosen.includes(i)}
                                onCheckedChange={(checked) =>
                                    onChange(
                                        checked === true
                                            ? [...chosen, i]
                                            : chosen.filter((c) => c !== i),
                                    )
                                }
                            />
                            {option}
                        </label>
                    ))}
                </div>
            );
        }
        case 'fill_blank':
            return (
                <Input
                    value={typeof value === 'string' ? value : ''}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={t('Your answer')}
                    aria-label={t('Your answer')}
                />
            );
        case 'short_answer':
            return (
                <Textarea
                    rows={4}
                    value={typeof value === 'string' ? value : ''}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={t('Your answer')}
                    aria-label={t('Your answer')}
                />
            );
        case 'ordering': {
            const order =
                Array.isArray(value) && value.length
                    ? (value as string[])
                    : (question.items ?? []);
            const move = (from: number, to: number) => {
                const next = [...order];
                [next[from], next[to]] = [next[to], next[from]];
                onChange(next);
            };

            return (
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                        {t('Put these in the right order.')}
                    </p>
                    <ol className="space-y-2">
                        {order.map((item, i) => (
                            <li
                                key={item}
                                className="flex items-center gap-2 rounded-lg border p-2 text-sm"
                            >
                                <span className="w-6 text-center font-medium text-muted-foreground">
                                    {i + 1}
                                </span>
                                <span className="flex-1">{item}</span>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="size-8"
                                    disabled={i === 0}
                                    onClick={() => move(i, i - 1)}
                                    aria-label={t('Move up')}
                                >
                                    <ArrowUp />
                                </Button>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="size-8"
                                    disabled={i === order.length - 1}
                                    onClick={() => move(i, i + 1)}
                                    aria-label={t('Move down')}
                                >
                                    <ArrowDown />
                                </Button>
                            </li>
                        ))}
                    </ol>
                </div>
            );
        }
        case 'matching': {
            const chosen = Array.isArray(value) ? (value as string[]) : [];

            return (
                <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                        {t('Match each item on the left.')}
                    </p>
                    {question.left?.map((left, i) => (
                        <div
                            key={left}
                            className="grid items-center gap-2 sm:grid-cols-2"
                        >
                            <Label className="font-normal">{left}</Label>
                            <Select
                                value={chosen[i] ?? ''}
                                onValueChange={(right) => {
                                    const next = [...chosen];
                                    next[i] = right;
                                    onChange(next);
                                }}
                            >
                                <SelectTrigger aria-label={left}>
                                    <SelectValue placeholder={t('Choose')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {question.right?.map((right) => (
                                        <SelectItem key={right} value={right}>
                                            {right}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
            );
        }
    }
}
