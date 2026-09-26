import { Head, setLayoutProps, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import attemptRoutes from '@/routes/admin/exam-attempts';

type WrittenAnswer = {
    question_id: number;
    title: string;
    guide: string | null;
    max: number;
    answer: string;
    awarded: number | null;
};

/**
 * Marking an attempt's short answers against each question's model answer.
 */
export default function MarkAttempt({
    attempt,
    answers,
}: {
    attempt: { id: number; user: { name: string }; exam: { title: string } };
    answers: WrittenAnswer[];
}) {
    const { t } = useTranslation();
    const form = useForm({
        marks: Object.fromEntries(
            answers.map((answer) => [
                answer.question_id,
                answer.awarded === null ? '' : String(answer.awarded),
            ]),
        ),
    });

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Exam results', href: attemptRoutes.index() },
            { title: attempt.user.name, href: attemptRoutes.show(attempt.id) },
        ],
    });

    return (
        <>
            <Head title={t('Mark answers')} />
            <form
                className="flex flex-1 flex-col gap-6 p-4 md:p-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.put(attemptRoutes.update.url(attempt.id));
                }}
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {t('Mark answers')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {attempt.user.name} · {attempt.exam.title}
                        </p>
                    </div>
                    <Button
                        type="submit"
                        disabled={form.processing || answers.length === 0}
                    >
                        {form.processing ? <Spinner /> : <Save />}
                        {t('Save marks')}
                    </Button>
                </div>
                {answers.length === 0 && (
                    <p className="text-muted-foreground">
                        {t('This exam has no written answers to mark.')}
                    </p>
                )}
                {answers.map((answer, i) => (
                    <Card key={answer.question_id} className="max-w-4xl">
                        <CardHeader>
                            <CardTitle className="text-base">
                                {i + 1}. {answer.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <p className="mb-1 font-medium">
                                    {t('Student’s answer')}
                                </p>
                                <p className="rounded-lg bg-muted p-3 whitespace-pre-line">
                                    {answer.answer || (
                                        <span className="text-muted-foreground">
                                            {t('No answer')}
                                        </span>
                                    )}
                                </p>
                            </div>
                            {answer.guide && (
                                <div>
                                    <p className="mb-1 font-medium">
                                        {t('Marking guide')}
                                    </p>
                                    <p className="whitespace-pre-line text-muted-foreground">
                                        {answer.guide}
                                    </p>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <Label htmlFor={`marks-${answer.question_id}`}>
                                    {t('Marks')}
                                </Label>
                                <Input
                                    id={`marks-${answer.question_id}`}
                                    type="number"
                                    min={0}
                                    max={answer.max}
                                    step="0.5"
                                    value={
                                        form.data.marks[answer.question_id] ??
                                        ''
                                    }
                                    onChange={(event) =>
                                        form.setData('marks', {
                                            ...form.data.marks,
                                            [answer.question_id]:
                                                event.target.value,
                                        })
                                    }
                                    className="w-28"
                                    required
                                />
                                <span className="text-muted-foreground">
                                    / {answer.max}
                                </span>
                            </div>
                            <InputError
                                message={
                                    (form.errors as Record<string, string>)[
                                        `marks.${answer.question_id}`
                                    ]
                                }
                            />
                        </CardContent>
                    </Card>
                ))}
            </form>
        </>
    );
}
