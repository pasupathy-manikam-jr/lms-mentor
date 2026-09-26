import { Head } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import {
    formatDeadline,
    JobMeta,
    sentenceCase,
} from '@/components/landing/job-meta';
import { PageHeader } from '@/components/landing/page-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { SiteHeader } from '@/components/landing/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/use-translation';
import { index } from '@/routes/careers';
import type { JobOpeningDetail } from '@/types';

const formatSalary = (
    job: JobOpeningDetail,
    t: ReturnType<typeof useTranslation>['t'],
) => {
    if (job.salary_min === null || job.salary_max === null) {
        return t('Negotiable');
    }

    const money = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: job.currency,
        maximumFractionDigits: 0,
    });

    return job.salary_min === job.salary_max
        ? t(':amount / month', { amount: money.format(job.salary_min) })
        : t(':amount / month', {
              amount: `${money.format(job.salary_min)} – ${money.format(job.salary_max)}`,
          });
};

export default function JobShow({
    job,
    summary,
}: {
    job: JobOpeningDetail;
    /** The description as plain text, for the meta description. */
    summary: string;
}) {
    const { t, locale } = useTranslation();

    // Job type, work mode and level come from a fixed set, so their English display words are translation keys.
    const facts = [
        { label: t('Salary'), value: formatSalary(job, t) },
        { label: t('Job type'), value: t(sentenceCase(job.job_type)) },
        { label: t('Work mode'), value: t(sentenceCase(job.work_type)) },
        {
            label: t('Experience'),
            value: t(sentenceCase(job.experience_level)),
        },
        { label: t('Positions'), value: String(job.positions) },
        { label: t('Apply by'), value: formatDeadline(job.deadline, locale) },
    ];

    return (
        <>
            <Head title={job.title}>
                <meta name="description" content={summary} />
            </Head>
            <div className="min-h-screen bg-background pt-18 text-foreground">
                <SiteHeader />

                <main>
                    <PageHeader
                        title={job.title}
                        parents={[{ label: t('Careers'), href: index.url() }]}
                    />

                    <section className="mx-auto grid max-w-5xl items-start gap-6 px-4 py-20 lg:grid-cols-3">
                        <div className="space-y-6 lg:col-span-2">
                            <JobMeta job={job} />
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('About the role')}</CardTitle>
                                </CardHeader>
                                <CardContent
                                    className="rich-text text-muted-foreground"
                                    dangerouslySetInnerHTML={{
                                        __html: job.description,
                                    }}
                                />
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {t('What you’ll need')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-2">
                                    {job.skills.map((skill) => (
                                        <Badge key={skill} variant="secondary">
                                            {skill}
                                        </Badge>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="lg:sticky lg:top-24">
                            <CardHeader>
                                <CardTitle>{t('Apply')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    {t(
                                        'Email your CV and a short note on why the role interests you.',
                                    )}
                                </p>
                                <Button className="w-full" asChild>
                                    <a
                                        href={`mailto:${job.apply_email}?subject=${encodeURIComponent(t('Application: :title', { title: job.title }))}`}
                                    >
                                        <Mail />
                                        {t('Apply via email')}
                                    </a>
                                </Button>
                                <Separator />
                                <dl className="space-y-3 text-sm">
                                    {facts.map((fact) => (
                                        <div
                                            key={fact.label}
                                            className="flex justify-between gap-4"
                                        >
                                            <dt className="text-muted-foreground">
                                                {fact.label}
                                            </dt>
                                            <dd className="text-right font-medium">
                                                {fact.value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </CardContent>
                        </Card>
                    </section>
                </main>

                <SiteFooter />
            </div>
        </>
    );
}
