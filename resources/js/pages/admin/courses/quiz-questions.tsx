import { Head, Link, setLayoutProps } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ExamQuestions } from '@/components/admin/exam-questions';
import type { ExamQuestion } from '@/components/admin/exam-questions';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import { edit, index } from '@/routes/admin/courses';
import quizQuestions from '@/routes/admin/courses/quizzes/questions';

/**
 * A course quiz's questions, with the same editor as exams.
 */
export default function QuizQuestions({
    course,
    quiz,
    questions,
}: {
    course: { id: number; title: string };
    quiz: { id: number; title: string; total_mark: number | null; pass_mark: number | null };
    questions: ExamQuestion[];
}) {
    const { t } = useTranslation();
    const route = { course: course.id, lesson: quiz.id };
    const total = questions.reduce((sum, question) => sum + Number(question.marks), 0);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Courses', href: index() },
            { title: course.title, href: edit(course.id) },
            { title: quiz.title, href: quizQuestions.index(route) },
        ],
    });

    return (
        <>
            <Head title={`${t('Quiz questions')} · ${quiz.title}`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">{quiz.title}</h1>
                        <p className="text-sm text-muted-foreground">
                            {t('Pass mark :pass of :total marks', {
                                pass: String(quiz.pass_mark ?? total),
                                total: String(total),
                            })}
                            {quiz.total_mark !== null && quiz.total_mark !== total && (
                                <span className="text-amber-600">
                                    {' '}
                                    ·{' '}
                                    {t('The quiz says :expected marks in total; the questions add up to :total.', {
                                        expected: String(quiz.total_mark),
                                        total: String(total),
                                    })}
                                </span>
                            )}
                        </p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={edit.url(course.id, { query: { tab: 'curriculum' } })}>
                            <ArrowLeft />
                            {t('Back to curriculum')}
                        </Link>
                    </Button>
                </div>
                <div className="max-w-4xl">
                    <ExamQuestions
                        urls={{
                            store: quizQuestions.store.url(route),
                            update: (id) => quizQuestions.update.url({ ...route, question: id }),
                            destroy: (id) => quizQuestions.destroy.url({ ...route, question: id }),
                            sort: quizQuestions.sort.url(route),
                        }}
                        items={questions}
                    />
                </div>
            </div>
        </>
    );
}
