import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { CertificateCanvas } from '@/components/certificates/certificate-canvas';
import type {
    CertificateContent,
    CertificateData,
    Design,
    TemplateColors,
} from '@/components/certificates/certificate-canvas';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';

/**
 * A student's certificate for a finished course. "Print or save as PDF" uses the browser's print
 * dialog; the page prints on one landscape A4 sheet.
 */
export default function CourseCertificate({
    template,
    data,
    courseUrl,
}: {
    template: {
        design: Design;
        colors: TemplateColors;
        content: CertificateContent;
    };
    data: CertificateData;
    courseUrl: string;
}) {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('Certificate · :course', { course: data.course })} />
            <style>{'@page { size: A4 landscape; margin: 0; }'}</style>
            <div className="min-h-screen bg-muted/40 px-4 py-8 print:bg-white print:p-0">
                <div className="mx-auto max-w-5xl space-y-6 print:max-w-none">
                    <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                        <Button variant="ghost" asChild>
                            <Link href={courseUrl}>
                                <ArrowLeft />
                                {t('Back to course')}
                            </Link>
                        </Button>
                        <Button onClick={() => window.print()}>
                            <Printer />
                            {t('Print or save as PDF')}
                        </Button>
                    </div>
                    <CertificateCanvas
                        design={template.design}
                        colors={template.colors}
                        content={template.content}
                        data={data}
                        className="rounded-lg shadow-lg [print-color-adjust:exact] print:rounded-none"
                    />
                </div>
            </div>
        </>
    );
}
