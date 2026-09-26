import {
    Briefcase,
    BriefcaseBusiness,
    Building2,
    Calendar,
    MapPin,
    TrendingUp,
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import type { JobOpening } from '@/types';

/** Formats a Y-m-d date as e.g. "17 October 2026" without shifting it through UTC. */
export const formatDeadline = (date: string, locale: string = 'en-IN') =>
    new Date(`${date}T00:00:00`).toLocaleDateString(locale, {
        dateStyle: 'long',
    });

export const sentenceCase = (text: string) =>
    text.charAt(0).toUpperCase() + text.slice(1);

/**
 * The icon row shared by the job list and the job page: location, type, work mode, level, positions, deadline.
 */
export function JobMeta({ job }: { job: JobOpening }) {
    const { t, locale } = useTranslation();
    const items = [
        { icon: MapPin, text: job.location },
        { icon: Briefcase, text: t(sentenceCase(job.job_type)) },
        { icon: Building2, text: t(sentenceCase(job.work_type)) },
        {
            icon: TrendingUp,
            text: t(sentenceCase(`${job.experience_level} level`)),
        },
        {
            icon: BriefcaseBusiness,
            text:
                job.positions === 1
                    ? t(':count position', { count: job.positions })
                    : t(':count positions', { count: job.positions }),
        },
        {
            icon: Calendar,
            text: t('Apply by :date', {
                date: formatDeadline(
                    job.deadline,
                    locale === 'en' ? undefined : locale,
                ),
            }),
        },
    ];

    return (
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {items.map((item) => (
                <li key={item.text} className="flex items-center gap-1">
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    {item.text}
                </li>
            ))}
        </ul>
    );
}
