import type {
    CertificateData,
    MarksheetData,
} from '@/components/certificates/certificate-canvas';

/** Sample student details for template previews. */
export const SAMPLE_CERTIFICATE: CertificateData = {
    recipient: 'Aisha Rahman',
    course: 'Foundations of Ayurveda',
    date: '25 September 2026',
    grade: 'Grade A',
};

export const SAMPLE_MARKSHEET: MarksheetData = {
    ...SAMPLE_CERTIFICATE,
    grade: 'A (91%)',
    rows: [
        { label: 'Assignment', marks: '45 / 50' },
        { label: 'Quiz', marks: '26 / 30' },
        { label: 'Final exam', marks: '82 / 90' },
    ],
};
