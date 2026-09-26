import { Head, Link, router, setLayoutProps } from '@inertiajs/react';
import {
    Award,
    Check,
    ClipboardList,
    EllipsisVertical,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import {
    CertificateCanvas,
    MarksheetCanvas,
} from '@/components/certificates/certificate-canvas';
import type {
    CertificateContent,
    Design,
    TemplateColors,
} from '@/components/certificates/certificate-canvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/use-translation';
import {
    SAMPLE_CERTIFICATE,
    SAMPLE_MARKSHEET,
} from '@/lib/certificate-samples';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import certificateRoutes from '@/routes/admin/certificates/certificate';
import marksheetRoutes from '@/routes/admin/certificates/marksheet';

export type Kind = 'certificate' | 'marksheet';

export type Template = {
    id: number;
    kind: Kind;
    type: 'course' | 'exam';
    name: string;
    design: Design;
    colors: TemplateColors;
    content: CertificateContent;
    is_active: boolean;
};

export const DESIGN_LABEL: Record<Design, string> = {
    classic: 'Classic',
    academic: 'Academic',
    elegant: 'Elegant',
    modern: 'Modern',
};

export const routesFor = (kind: Kind) =>
    kind === 'certificate' ? certificateRoutes : marksheetRoutes;

/**
 * Certificate → Certificate and Marksheet, following the Mentor demo: template cards grouped by course
 * and exam, the active one marked, each with Activate, Edit and Delete.
 */
export default function CertificateTemplates({
    kind,
    templates,
}: {
    kind: Kind;
    templates: Partial<Record<'course' | 'exam', Template[]>>;
}) {
    const { t } = useTranslation();
    const routes = routesFor(kind);
    const title = kind === 'certificate' ? 'Certificates' : 'Marksheets';
    const groups = (
        kind === 'certificate' ? ['course', 'exam'] : ['course']
    ) as ('course' | 'exam')[];

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title, href: routes.index() },
        ],
    });

    return (
        <>
            <Head title={t(title)} />
            <div className="flex flex-1 flex-col gap-8 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t(title)}
                    </h1>
                    <Button asChild>
                        <Link href={routes.create()}>
                            <Plus />
                            {t('Create template')}
                        </Link>
                    </Button>
                </div>

                {groups.map((type) => (
                    <section key={type} className="space-y-4">
                        <h2 className="text-xl font-semibold">
                            {t(
                                kind === 'certificate'
                                    ? type === 'course'
                                        ? 'Course certificate templates'
                                        : 'Exam certificate templates'
                                    : 'Course marksheet templates',
                            )}
                        </h2>
                        {!templates[type]?.length ? (
                            <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                                {t('No templates yet.')}
                            </p>
                        ) : (
                            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                {templates[type]!.map((template) => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                ))}
            </div>
        </>
    );
}

function TemplateCard({ template }: { template: Template }) {
    const { t } = useTranslation();
    const routes = routesFor(template.kind);
    const Icon = template.kind === 'certificate' ? Award : ClipboardList;

    return (
        <Card
            className={cn(
                'gap-4 p-5',
                template.is_active && 'border-2 border-primary',
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <Icon className="size-5 shrink-0 text-muted-foreground" />
                    <h3 className="truncate font-semibold">{template.name}</h3>
                    {template.is_active && (
                        <Badge>
                            <Check />
                            {t('Active')}
                        </Badge>
                    )}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full"
                            aria-label={t('Actions for :name', {
                                name: template.name,
                            })}
                        >
                            <EllipsisVertical />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {!template.is_active && (
                            <DropdownMenuItem
                                onSelect={() =>
                                    router.post(
                                        routes.activate.url(template.id),
                                        {},
                                        { preserveScroll: true },
                                    )
                                }
                            >
                                <Check />
                                {t('Set as active')}
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                            <Link href={routes.edit(template.id)}>
                                <Pencil />
                                {t('Edit')}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            disabled={template.is_active}
                            onSelect={() =>
                                router.delete(routes.destroy.url(template.id), {
                                    preserveScroll: true,
                                })
                            }
                        >
                            <Trash2 />
                            {t('Delete')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Link
                href={routes.edit(template.id)}
                className="block overflow-hidden rounded-lg border"
            >
                {template.kind === 'certificate' ? (
                    <CertificateCanvas
                        design={template.design}
                        colors={template.colors}
                        content={template.content}
                        data={SAMPLE_CERTIFICATE}
                    />
                ) : (
                    <MarksheetCanvas
                        design={template.design}
                        colors={template.colors}
                        content={template.content}
                        data={SAMPLE_MARKSHEET}
                        className="mx-auto max-w-[70%]"
                    />
                )}
            </Link>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{t(DESIGN_LABEL[template.design])}</span>
                <span className="flex gap-1.5" aria-hidden>
                    {Object.values(template.colors).map((color, i) => (
                        <span
                            key={i}
                            className="size-4 rounded-full border"
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </span>
            </div>
        </Card>
    );
}
