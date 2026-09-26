import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type Design = 'classic' | 'academic' | 'elegant' | 'modern';

export type TemplateColors = {
    primary: string;
    accent: string;
    background: string;
    text: string;
};

export type CertificateContent = {
    title: string;
    subtitle?: string | null;
    organization?: string | null;
    signatory?: string | null;
    footer?: string | null;
};

export type CertificateData = {
    recipient: string;
    course: string;
    date: string;
    grade?: string | null;
};

export type MarksheetData = CertificateData & {
    rows: { label: string; marks: string }[];
};

const SCRIPT = "'Great Vibes', 'Brush Script MT', cursive";
const SERIF = "'Libre Baskerville', Georgia, serif";

/** Font size as a share of the certificate's width, so it scales from a thumbnail to a full page. */
const size = (percent: number): CSSProperties => ({
    fontSize: `${percent}cqw`,
});

/**
 * A certificate in one of the four designs (following the Mentor demo's Classic, Academic, Elegant and
 * Modern). Landscape A4 proportions.
 */
export function CertificateCanvas({
    design,
    colors,
    content,
    data,
    className,
}: {
    design: Design;
    colors: TemplateColors;
    content: CertificateContent;
    data: CertificateData;
    className?: string;
}) {
    const vars = {
        '--c-primary': colors.primary,
        '--c-accent': colors.accent,
        '--c-bg': colors.background,
        '--c-text': colors.text,
        containerType: 'inline-size',
    } as CSSProperties;

    return (
        <div
            style={vars}
            className={cn(
                'certificate-canvas relative aspect-[297/210] w-full overflow-hidden bg-[var(--c-bg)] text-[var(--c-text)] print:shadow-none',
                className,
            )}
        >
            {design === 'modern' ? (
                <ModernCertificate content={content} data={data} />
            ) : (
                <CenteredCertificate
                    design={design}
                    content={content}
                    data={data}
                />
            )}
        </div>
    );
}

function CenteredCertificate({
    design,
    content,
    data,
}: {
    design: Exclude<Design, 'modern'>;
    content: CertificateContent;
    data: CertificateData;
}) {
    return (
        <>
            {design === 'classic' && (
                <>
                    <div className="absolute inset-[3%] border-[0.5cqw] border-double border-[var(--c-primary)]" />
                    <div className="absolute inset-[4.6%] border-[0.12cqw] border-[var(--c-accent)]" />
                    {[
                        'top-[2.2%] left-[2.2%]',
                        'top-[2.2%] right-[2.2%] rotate-90',
                        'bottom-[2.2%] right-[2.2%] rotate-180',
                        'bottom-[2.2%] left-[2.2%] -rotate-90',
                    ].map((position) => (
                        <Flourish key={position} className={position} />
                    ))}
                </>
            )}
            {design === 'academic' && (
                <>
                    <div className="absolute inset-[3.5%] border-[0.15cqw] border-[var(--c-accent)]" />
                    <div className="absolute -top-[10%] -left-[10%] h-[34%] w-[22%] rotate-45 bg-[var(--c-primary)]" />
                    <div className="absolute -top-[10%] -left-[4%] h-[34%] w-[1.2%] rotate-45 bg-[var(--c-accent)]" />
                    <div className="absolute -right-[10%] -bottom-[10%] h-[34%] w-[22%] rotate-45 bg-[var(--c-primary)]" />
                    <div className="absolute -right-[4%] -bottom-[10%] h-[34%] w-[1.2%] rotate-45 bg-[var(--c-accent)]" />
                </>
            )}
            {design === 'elegant' && (
                <>
                    <div className="absolute inset-[4%] border-[0.25cqw] border-[var(--c-accent)]" />
                    <div className="absolute inset-[5.2%] border-[0.08cqw] border-[var(--c-primary)]" />
                    {[
                        'top-[3.3%] left-[3.3%]',
                        'top-[3.3%] right-[3.3%]',
                        'bottom-[3.3%] left-[3.3%]',
                        'bottom-[3.3%] right-[3.3%]',
                    ].map((position) => (
                        <span
                            key={position}
                            className={`absolute size-[1.6%] rotate-45 bg-[var(--c-primary)] ${position}`}
                        />
                    ))}
                </>
            )}

            <div
                className="relative flex h-full flex-col items-center justify-center px-[14%] text-center"
                style={{ fontFamily: SERIF }}
            >
                {design === 'academic' && content.organization && (
                    <p
                        style={size(1.6)}
                        className="mb-[1%] font-bold tracking-[0.25em] text-[var(--c-primary)] uppercase"
                    >
                        {content.organization}
                    </p>
                )}
                <p
                    style={size(1.7)}
                    className="tracking-[0.3em] text-[var(--c-primary)] uppercase"
                >
                    {content.title}
                </p>
                <Divider />
                <p style={size(1.25)} className="italic opacity-80">
                    This certificate is presented to
                </p>
                <p
                    style={{ ...size(6), fontFamily: SCRIPT }}
                    className="my-[0.5%] leading-tight text-[var(--c-primary)]"
                >
                    {data.recipient}
                </p>
                {content.subtitle && (
                    <p style={size(1.5)} className="italic opacity-80">
                        {content.subtitle}
                    </p>
                )}
                <p
                    style={size(2.3)}
                    className="mt-[1%] font-bold text-[var(--c-primary)]"
                >
                    {data.course}
                </p>
                {data.grade && (
                    <p style={size(1.5)} className="mt-[0.5%] opacity-70">
                        {data.grade}
                    </p>
                )}
                <Divider />
                <div className="mt-[3%] grid w-full grid-cols-2 gap-[8%]">
                    <Signature
                        value={content.signatory || content.organization || ''}
                        label={content.signatory ? 'Signature' : 'Organisation'}
                    />
                    <Signature value={data.date} label="Date issued" />
                </div>
            </div>
        </>
    );
}

function ModernCertificate({
    content,
    data,
}: {
    content: CertificateContent;
    data: CertificateData;
}) {
    return (
        <>
            <div className="absolute inset-y-[5%] left-[4%] w-[0.7%] bg-[var(--c-primary)]" />
            <div className="absolute -top-[18%] -right-[8%] size-[34%] rounded-full bg-[var(--c-accent)] opacity-40" />
            <div className="relative flex h-full flex-col px-[9%] py-[7%] font-sans">
                <p
                    style={size(1.4)}
                    className="font-semibold tracking-[0.3em] text-[var(--c-primary)] uppercase"
                >
                    {content.title}
                </p>
                <div className="mt-[1%] h-[0.3cqw] w-[6%] bg-[var(--c-primary)]" />
                <div className="my-auto">
                    <p style={size(1.3)} className="opacity-60">
                        Awarded to
                    </p>
                    <p
                        style={size(5.2)}
                        className="leading-tight font-bold tracking-tight"
                    >
                        {data.recipient}
                    </p>
                    {content.subtitle && (
                        <p style={size(1.5)} className="mt-[1%] opacity-70">
                            {content.subtitle}
                        </p>
                    )}
                    <p
                        style={size(2.4)}
                        className="mt-[0.5%] font-semibold text-[var(--c-primary)]"
                    >
                        {data.course}
                    </p>
                    {data.grade && (
                        <p style={size(1.5)} className="mt-[0.5%] opacity-70">
                            {data.grade}
                        </p>
                    )}
                </div>
                <div className="flex items-end justify-between gap-[8%]">
                    <Signature
                        value={content.signatory || content.organization || ''}
                        label={content.signatory ? 'Signature' : 'Organisation'}
                        align="start"
                    />
                    <Signature
                        value={data.date}
                        label="Date issued"
                        align="end"
                    />
                </div>
            </div>
        </>
    );
}

/**
 * A course marksheet in one of the four designs. Portrait A4 proportions.
 */
export function MarksheetCanvas({
    design,
    colors,
    content,
    data,
    className,
}: {
    design: Design;
    colors: TemplateColors;
    content: CertificateContent;
    data: MarksheetData;
    className?: string;
}) {
    const vars = {
        '--c-primary': colors.primary,
        '--c-accent': colors.accent,
        '--c-bg': colors.background,
        '--c-text': colors.text,
        containerType: 'inline-size',
    } as CSSProperties;
    const isSerif = design === 'academic' || design === 'elegant';
    const details: [string, string][] = [
        ['Student name', data.recipient],
        ['Course', data.course],
        ['Completion date', data.date],
        ['Overall grade', data.grade ?? '—'],
    ];

    return (
        <div
            style={{
                ...vars,
                fontFamily: isSerif ? SERIF : undefined,
            }}
            className={cn(
                'marksheet-canvas relative flex aspect-[210/297] w-full flex-col overflow-hidden bg-[var(--c-bg)] px-[9%] py-[8%] text-[var(--c-text)]',
                className,
            )}
        >
            {design === 'modern' && (
                <div className="absolute inset-y-0 left-0 w-[2%] bg-[var(--c-primary)]" />
            )}
            {design === 'academic' && (
                <div className="pointer-events-none absolute inset-[3%] border-[0.4cqw] border-[var(--c-primary)]" />
            )}
            {design === 'elegant' && (
                <div className="pointer-events-none absolute inset-[3%] border-[0.25cqw] border-[var(--c-accent)]" />
            )}
            <header
                className={cn(
                    'pb-[3%]',
                    design === 'modern' ? 'text-start' : 'text-center',
                    design === 'classic' &&
                        'border-b-[0.3cqw] border-[var(--c-primary)]',
                )}
            >
                <p
                    style={size(4.2)}
                    className={cn(
                        'font-bold text-[var(--c-primary)]',
                        design === 'elegant' && 'italic',
                    )}
                >
                    {content.title}
                </p>
                {content.organization && (
                    <p
                        style={size(2)}
                        className="mt-[1%] tracking-[0.15em] uppercase opacity-70"
                    >
                        {content.organization}
                    </p>
                )}
            </header>

            <dl
                className={cn(
                    'mt-[5%] grid grid-cols-2 gap-[3%]',
                    design === 'academic' &&
                        'border-[0.2cqw] border-[var(--c-primary)] p-[3%]',
                )}
            >
                {details.map(([label, value]) => (
                    <div
                        key={label}
                        className={cn(
                            'text-center',
                            design === 'modern' &&
                                'rounded-[1cqw] bg-[var(--c-accent)]/40 p-[2%]',
                        )}
                    >
                        <dt
                            style={size(1.6)}
                            className="tracking-wider uppercase opacity-60"
                        >
                            {label}
                        </dt>
                        <dd
                            style={size(2.4)}
                            className="font-semibold text-[var(--c-primary)]"
                        >
                            {value}
                        </dd>
                    </div>
                ))}
            </dl>

            <p
                style={size(2.2)}
                className="mt-[6%] mb-[2%] text-center font-semibold"
            >
                Marks summary
            </p>
            <table className="w-full" style={size(2)}>
                <thead>
                    <tr
                        className={cn(
                            design === 'modern'
                                ? 'bg-[var(--c-primary)] text-white'
                                : 'border-b-[0.3cqw] border-[var(--c-primary)]',
                        )}
                    >
                        <th className="px-[2%] py-[1.5%] text-start">
                            Assessment
                        </th>
                        <th className="px-[2%] py-[1.5%] text-end">Marks</th>
                    </tr>
                </thead>
                <tbody>
                    {data.rows.map((row) => (
                        <tr
                            key={row.label}
                            className="border-b-[0.15cqw] border-[var(--c-accent)]"
                        >
                            <td className="px-[2%] py-[1.5%]">{row.label}</td>
                            <td className="px-[2%] py-[1.5%] text-end tabular-nums">
                                {row.marks}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {content.footer && (
                <p
                    style={size(1.8)}
                    className={cn(
                        'mt-auto pt-[3%] text-center italic opacity-70',
                        design === 'classic' &&
                            'border-t-[0.3cqw] border-[var(--c-primary)]',
                    )}
                >
                    {content.footer}
                </p>
            )}
        </div>
    );
}

function Divider() {
    return (
        <div className="my-[1.5%] flex w-[16%] items-center gap-[6%] text-[var(--c-accent)]">
            <span className="h-[0.12cqw] flex-1 bg-current" />
            <span style={size(1.2)}>✦</span>
            <span className="h-[0.12cqw] flex-1 bg-current" />
        </div>
    );
}

function Signature({
    value,
    label,
    align = 'center',
}: {
    value: string;
    label: string;
    align?: 'start' | 'center' | 'end';
}) {
    return (
        <div className={`text-${align}`}>
            <p
                style={{ ...size(2), fontFamily: SCRIPT }}
                className="border-b-[0.12cqw] border-[var(--c-accent)] pb-[2%] text-[var(--c-primary)]"
            >
                {value}
            </p>
            <p
                style={size(1)}
                className="mt-[3%] tracking-[0.2em] uppercase opacity-60"
            >
                {label}
            </p>
        </div>
    );
}

function Flourish({ className }: { className: string }): ReactNode {
    return (
        <svg
            viewBox="0 0 40 40"
            className={`absolute size-[7%] text-[var(--c-primary)] ${className}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden
        >
            <path d="M4 36 V12 Q4 4 12 4 H36" />
            <path d="M9 36 V15 Q9 9 15 9 H36" opacity="0.6" />
            <path d="M14 14 q6 -2 8 4 q-6 2 -8 -4z" fill="currentColor" />
        </svg>
    );
}
