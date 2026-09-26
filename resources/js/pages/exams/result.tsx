import { Head, Link } from '@inertiajs/react';
import { Award, CircleCheck, CircleX, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';

/**
 * An exam attempt's result: score, pass or fail (or waiting for short answers to be marked), and the
 * marks for each question. Correct answers are not shown, so later attempts stay fair.
 */
export default function ExamResult({
    attempt,
    exam,
    review,
}: {
    attempt: {
        id: number;
        score: string | null;
        total_marks: string;
        percentage: number;
        needs_review: boolean;
        passed: boolean | null;
        submitted_at: string;
    };
    exam: {
        title: string;
        pass_label: string;
        back_url: string;
        certificate_url: string | null;
    };
    review: {
        id: number;
        title: string;
        marks: number;
        awarded: number | null;
    }[];
}) {
    const { t } = useTranslation();

    return (
        <>
            <Head title={`${t('Result')} · ${exam.title}`} />
            <div className="min-h-screen bg-muted/40 px-4 py-10">
                <div className="mx-auto max-w-3xl space-y-6">
                    <Card>
                        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                            {attempt.needs_review ? (
                                <Clock className="size-12 text-amber-500" />
                            ) : attempt.passed ? (
                                <CircleCheck className="size-12 text-emerald-600" />
                            ) : (
                                <CircleX className="size-12 text-destructive" />
                            )}
                            <h1 className="text-2xl font-semibold">
                                {attempt.needs_review
                                    ? t('Waiting for marking')
                                    : attempt.passed
                                      ? t('You passed!')
                                      : t('Not passed this time')}
                            </h1>
                            <p className="text-muted-foreground">
                                {exam.title}
                            </p>
                            <p className="text-4xl font-bold tabular-nums">
                                {attempt.percentage}%
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {t(':score of :total marks', {
                                    score: String(Number(attempt.score ?? 0)),
                                    total: String(Number(attempt.total_marks)),
                                })}{' '}
                                · {exam.pass_label}
                            </p>
                            {attempt.needs_review && (
                                <p className="max-w-md text-sm text-muted-foreground">
                                    {t(
                                        'Some written answers are marked by an instructor. Your final result appears here once they are marked.',
                                    )}
                                </p>
                            )}
                            <div className="mt-2 flex flex-wrap justify-center gap-3">
                                <Button variant="outline" asChild>
                                    <Link href={exam.back_url}>
                                        {t('Back')}
                                    </Link>
                                </Button>
                                {attempt.passed && exam.certificate_url && (
                                    <Button asChild>
                                        <Link href={exam.certificate_url}>
                                            <Award />
                                            {t('View certificate')}
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('Marks by question')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ol className="divide-y">
                                {review.map((question, i) => (
                                    <li
                                        key={question.id}
                                        className="flex items-center justify-between gap-4 py-3 text-sm"
                                    >
                                        <span>
                                            {i + 1}. {question.title}
                                        </span>
                                        {question.awarded === null ? (
                                            <Badge variant="secondary">
                                                {t('Being marked')}
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant={
                                                    question.awarded > 0
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                className="tabular-nums"
                                            >
                                                {question.awarded} /{' '}
                                                {question.marks}
                                            </Badge>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
