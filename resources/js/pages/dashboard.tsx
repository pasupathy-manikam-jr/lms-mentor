import { Head, Link } from '@inertiajs/react';
import { BookOpen, GraduationCap, UserCheck, Users, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import payouts from '@/routes/admin/billing/payouts';
import instructorPayouts from '@/routes/instructor/payouts';

type CourseStatusName =
    | 'approved'
    | 'upcoming'
    | 'pending'
    | 'private'
    | 'draft';

type DashboardProps = {
    /** Instructors see the same overview for their own courses. */
    role: 'admin' | 'instructor';
    stats: {
        courses: number;
        lessons: number;
        enrollments: number;
        students: number;
        instructors?: number;
    };
    revenueByMonth: { month: number; revenue: number }[];
    courseStatus: { status: CourseStatusName; count: number }[];
    pendingWithdrawals: {
        id: number;
        amount: string;
        status: string;
        created_at: string;
        instructor: { id: number; name: string } | null;
    }[];
};

// Fixed slot per status, so a status keeps its colour whatever the counts are.
const statusColor: Record<CourseStatusName, string> = {
    approved: 'var(--viz-1)',
    upcoming: 'var(--viz-2)',
    pending: 'var(--viz-3)',
    private: 'var(--viz-4)',
    draft: 'var(--viz-5)',
};

const statusLabel: Record<CourseStatusName, string> = {
    approved: 'Approved',
    upcoming: 'Upcoming',
    pending: 'Pending',
    private: 'Private',
    draft: 'Draft',
};

const tooltipStyle = {
    backgroundColor: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--popover-foreground)',
    fontSize: 12,
};

export default function Dashboard({
    role,
    stats,
    revenueByMonth,
    courseStatus,
    pendingWithdrawals,
}: DashboardProps) {
    const { t, intlLocale } = useTranslation();

    const money = new Intl.NumberFormat(intlLocale, {
        style: 'currency',
        currency: 'USD',
        currencyDisplay: 'narrowSymbol',
        maximumFractionDigits: 2,
    });
    const monthName = (month: number, width: 'short' | 'long') =>
        new Date(2000, month - 1, 1).toLocaleDateString(intlLocale, {
            month: width,
        });

    const tiles: { label: string; value: number; icon: LucideIcon }[] = [
        { label: t('Courses'), value: stats.courses, icon: BookOpen },
        { label: t('Lessons'), value: stats.lessons, icon: Video },
        {
            label: t('Enrollments'),
            value: stats.enrollments,
            icon: UserCheck,
        },
        { label: t('Students'), value: stats.students, icon: Users },
        ...(stats.instructors !== undefined
            ? [
                  {
                      label: t('Instructors'),
                      value: stats.instructors,
                      icon: GraduationCap,
                  },
              ]
            : []),
    ];
    const isAdmin = role === 'admin';
    const revenueTitle = isAdmin
        ? t('Admin revenue this year')
        : t('Instructor revenue this year');

    const revenue = revenueByMonth.map((entry) => ({
        ...entry,
        label: monthName(entry.month, 'short'),
    }));
    const totalCourses = courseStatus.reduce((sum, s) => sum + s.count, 0);
    const slices = courseStatus.filter((s) => s.count > 0);

    return (
        <>
            <Head title={t('Dashboard')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <dl
                    className={`grid gap-4 sm:grid-cols-2 ${tiles.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}
                >
                    {tiles.map((tile) => (
                        <Card key={tile.label} className="py-4">
                            <CardContent className="flex items-center justify-between gap-4 px-4">
                                <div className="flex flex-col-reverse">
                                    <dt className="text-sm text-muted-foreground">
                                        {tile.label}
                                    </dt>
                                    <dd className="text-2xl font-semibold tabular-nums">
                                        {tile.value.toLocaleString(intlLocale)}
                                    </dd>
                                </div>
                                <span className="rounded-full bg-muted p-3">
                                    <tile.icon
                                        className="size-5 text-primary"
                                        aria-hidden
                                    />
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </dl>

                <Card>
                    <CardHeader>
                        <CardTitle>{revenueTitle}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="h-80"
                            role="img"
                            aria-label={revenueTitle}
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={revenue}
                                    margin={{
                                        top: 8,
                                        right: 8,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid
                                        vertical={false}
                                        stroke="var(--border)"
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{
                                            fill: 'var(--muted-foreground)',
                                            fontSize: 12,
                                        }}
                                    />
                                    <YAxis
                                        width={56}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                        tickFormatter={(value: number) =>
                                            money.format(value)
                                        }
                                        tick={{
                                            fill: 'var(--muted-foreground)',
                                            fontSize: 12,
                                        }}
                                    />
                                    <Tooltip
                                        contentStyle={tooltipStyle}
                                        cursor={{ stroke: 'var(--border)' }}
                                        labelFormatter={(_, payload) =>
                                            payload?.[0]
                                                ? monthName(
                                                      payload[0].payload.month,
                                                      'long',
                                                  )
                                                : ''
                                        }
                                        formatter={(value) => [
                                            money.format(Number(value)),
                                            isAdmin
                                                ? t('Admin revenue')
                                                : t('Instructor revenue'),
                                        ]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="var(--viz-1)"
                                        strokeWidth={2}
                                        fill="var(--viz-1)"
                                        fillOpacity={0.15}
                                        activeDot={{ r: 4 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-12">
                    <Card className="lg:col-span-4">
                        <CardHeader>
                            <CardTitle>{t('Course status')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                className="h-56"
                                role="img"
                                aria-label={t('Course status')}
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Tooltip
                                            contentStyle={tooltipStyle}
                                            formatter={(value, _, item) => [
                                                value,
                                                t(
                                                    statusLabel[
                                                        item.payload
                                                            .status as CourseStatusName
                                                    ],
                                                ),
                                            ]}
                                        />
                                        <Pie
                                            data={slices}
                                            dataKey="count"
                                            nameKey="status"
                                            innerRadius="55%"
                                            outerRadius="90%"
                                            // A 2px gap separates slices; a lone slice needs no seam.
                                            stroke="var(--card)"
                                            strokeWidth={
                                                slices.length > 1 ? 2 : 0
                                            }
                                        >
                                            {slices.map((s) => (
                                                <Cell
                                                    key={s.status}
                                                    fill={statusColor[s.status]}
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Legend doubles as the table view: every status with its count and share. */}
                            <ul className="space-y-2 text-sm">
                                {courseStatus.map((s) => (
                                    <li
                                        key={s.status}
                                        className="flex items-center gap-2"
                                    >
                                        <span
                                            className="size-3 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    statusColor[s.status],
                                            }}
                                            aria-hidden
                                        />
                                        <span className="flex-1 text-muted-foreground">
                                            {t(statusLabel[s.status])}
                                        </span>
                                        <span className="font-medium tabular-nums">
                                            {s.count}
                                        </span>
                                        <span className="w-10 text-end text-muted-foreground tabular-nums">
                                            {totalCourses > 0
                                                ? `${Math.round((s.count / totalCourses) * 100)}%`
                                                : '0%'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="gap-0 pb-0 lg:col-span-8">
                        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                            <CardTitle>
                                {t('Latest pending withdrawal requests')}
                            </CardTitle>
                            <Button variant="outline" size="sm" asChild>
                                <Link
                                    href={
                                        isAdmin
                                            ? payouts.requests()
                                            : instructorPayouts.index()
                                    }
                                >
                                    {t('View all')}
                                </Link>
                            </Button>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full border-t text-sm">
                                <thead className="text-start text-muted-foreground">
                                    <tr className="border-b">
                                        <th className="px-6 py-3 text-start font-medium">
                                            {t('Name')}
                                        </th>
                                        <th className="px-6 py-3 text-center font-medium">
                                            {t('Payout amount')}
                                        </th>
                                        <th className="px-6 py-3 text-center font-medium">
                                            {t('Status')}
                                        </th>
                                        <th className="px-6 py-3 text-end font-medium">
                                            {t('Action')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingWithdrawals.length > 0 ? (
                                        pendingWithdrawals.map((request) => (
                                            <tr
                                                key={request.id}
                                                className="border-b last:border-0 hover:bg-muted/50"
                                            >
                                                <td className="px-6 py-3 font-medium">
                                                    {request.instructor?.name}
                                                </td>
                                                <td className="px-6 py-3 text-center tabular-nums">
                                                    {money.format(
                                                        Number(request.amount),
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <Badge variant="secondary">
                                                        {t('Pending')}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-3 text-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={
                                                                isAdmin
                                                                    ? payouts.requests()
                                                                    : instructorPayouts.index()
                                                            }
                                                        >
                                                            {t('View')}
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="h-24 text-center text-muted-foreground"
                                            >
                                                {t(
                                                    'No pending withdrawal requests.',
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
