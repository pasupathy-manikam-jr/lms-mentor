import { useTranslation } from '@/hooks/use-translation';

export type PageKind = 'home' | 'about' | 'team' | 'careers';

export type PageField = {
    key: string;
    label: string;
    /** The built-in English wording; it is translated when the admin leaves the field empty. */
    default: string;
    multiline?: boolean;
    /** Fills :number in the label (numbered FAQ entries). */
    number?: number;
};

export type PageSection = { title: string; fields: PageField[] };

/** What a built-in page's controller sends: see App\Models\Page::propsFor(). */
export type PageProps = {
    content: Partial<Record<string, string>>;
    meta_title: string | null;
    meta_description: string | null;
    og_image_url: string | null;
};

const heading = (
    prefix: string,
    eyebrow: string,
    title: string,
    text: string,
): PageField[] => [
    { key: `${prefix}_eyebrow`, label: 'Label', default: eyebrow },
    { key: `${prefix}_title`, label: 'Heading', default: title },
    { key: `${prefix}_text`, label: 'Text', default: text, multiline: true },
];

const newsletter: PageSection = {
    title: 'Newsletter',
    fields: [
        {
            key: 'newsletter_title',
            label: 'Heading',
            default: 'One useful lesson, every week',
        },
        {
            key: 'newsletter_text',
            label: 'Text',
            default:
                'Short, practical tips from our instructors, straight to your inbox. No spam, and you can unsubscribe at any time.',
            multiline: true,
        },
    ],
};

const faqs: [string, string][] = [
    [
        'Do I need any experience before I start?',
        'No. Every course lists what you should know beforehand, and most start from the basics.',
    ],
    [
        'How long can I access a course?',
        'For as long as your account is active, including any new lessons the instructor adds later.',
    ],
    [
        'Will I get a certificate?',
        'Yes. Finish every lesson and you get a certificate you can add to your CV or LinkedIn profile.',
    ],
    [
        'What if I get stuck?',
        'Each lesson has a discussion thread where you can ask the instructor and other learners for help.',
    ],
    [
        "What if a course isn't right for me?",
        'You can ask for a full refund within 30 days of buying it.',
    ],
];

/**
 * The editable sections of each built-in page, in page order. Keys must stay stable: saved wording is
 * stored under them.
 */
export const PAGE_SCHEMAS: Record<
    PageKind,
    { seo: { title: string; description: string }; sections: PageSection[] }
> = {
    home: {
        seo: {
            title: 'Health sciences & management courses',
            description:
                'Courses in Ayurveda, Siddha medicine, medical sciences and management, taught by practitioners and professors.',
        },
        sections: [
            {
                title: 'Hero',
                fields: [
                    {
                        key: 'hero_eyebrow',
                        label: 'Label',
                        default: 'Ancient wisdom, modern learning',
                    },
                    {
                        key: 'hero_title',
                        label: 'Heading',
                        default: 'Learn the sciences of healing and leadership',
                    },
                    {
                        key: 'hero_text',
                        label: 'Text',
                        default:
                            'Courses in Ayurveda, Siddha medicine, medical sciences and management, taught by practitioners and professors. Study at your own pace and earn certificates for what you learn.',
                        multiline: true,
                    },
                    {
                        key: 'hero_primary_button',
                        label: 'Main button',
                        default: 'Explore courses',
                    },
                    {
                        key: 'hero_secondary_button',
                        label: 'Sign-up button',
                        default: 'Start free',
                    },
                    {
                        key: 'hero_proof',
                        label: 'Rating caption',
                        default: 'Loved by 12,000+ learners',
                    },
                ],
            },
            {
                title: 'Categories',
                fields: heading(
                    'categories',
                    'Categories',
                    'Find your path',
                    'Pick a subject and learn it from people who practise it.',
                ),
            },
            {
                title: 'Popular courses',
                fields: heading(
                    'popular',
                    'Popular',
                    'Most-loved courses',
                    'The courses learners recommend most, from first principles to clinical practice.',
                ),
            },
            {
                title: 'New courses',
                fields: heading(
                    'latest',
                    'New',
                    'Just released',
                    'Fresh courses added this month. Be one of the first to take them.',
                ),
            },
            {
                title: 'Instructors',
                fields: heading(
                    'instructors',
                    'Instructors',
                    'Learn from experienced practitioners',
                    'Every instructor is a practising physician, therapist or management professional.',
                ),
            },
            {
                title: 'FAQ',
                fields: [
                    ...heading(
                        'faq',
                        'FAQ',
                        'Questions, answered',
                        "Can't find what you're looking for? Get in touch and we'll help.",
                    ),
                    ...faqs.flatMap(([question, answer], i) => [
                        {
                            key: `faq_${i + 1}_question`,
                            label: 'Question :number',
                            number: i + 1,
                            default: question,
                        },
                        {
                            key: `faq_${i + 1}_answer`,
                            label: 'Answer :number',
                            number: i + 1,
                            default: answer,
                            multiline: true,
                        },
                    ]),
                ],
            },
            {
                title: 'Blog',
                fields: heading(
                    'blog',
                    'Blog',
                    'Fresh from the blog',
                    'Articles on traditional medicine, healthcare and management.',
                ),
            },
            newsletter,
        ],
    },
    about: {
        seo: {
            title: 'About Us',
            description:
                'Why we teach health sciences and management online, and the practitioners who teach here.',
        },
        sections: [
            {
                title: 'Page header',
                fields: [
                    {
                        key: 'header_title',
                        label: 'Title',
                        default: 'About Us',
                    },
                ],
            },
            {
                title: 'Mission and values',
                fields: [
                    {
                        key: 'mission_title',
                        label: 'Mission heading',
                        default: 'Our mission',
                    },
                    {
                        key: 'mission_text',
                        label: 'Mission text',
                        default:
                            'To make trustworthy training in health sciences and management available to anyone, anywhere. We bring classical systems such as Ayurveda and Siddha together with modern medical science and management practice, so learners can apply what they study in clinics, hospitals and their own lives.',
                        multiline: true,
                    },
                    {
                        key: 'values_title',
                        label: 'Values heading',
                        default: 'Our values',
                    },
                    {
                        key: 'values_text',
                        label: 'Values text',
                        default:
                            'Every course is taught by a practising physician, therapist or management professional. We respect traditional knowledge, check it against evidence, and keep lessons practical, so you finish each one knowing what to do next.',
                        multiline: true,
                    },
                ],
            },
            {
                title: 'Learner success',
                fields: [
                    {
                        key: 'success_title',
                        label: 'Heading',
                        default: 'Our success is our learners’ success',
                    },
                    {
                        key: 'success_text',
                        label: 'Text',
                        default:
                            'Every certificate earned and every skill used at work tells us we are teaching the right things in the right way.',
                        multiline: true,
                    },
                    {
                        key: 'success_button',
                        label: 'Button',
                        default: 'Browse courses',
                    },
                ],
            },
            {
                title: 'Team',
                fields: [
                    {
                        key: 'team_title',
                        label: 'Heading',
                        default: 'The people behind the mission',
                    },
                    {
                        key: 'team_text',
                        label: 'Text',
                        default:
                            'Physicians, therapists and management scientists who teach from years of practice, not just from textbooks.',
                        multiline: true,
                    },
                ],
            },
            newsletter,
        ],
    },
    team: {
        seo: {
            title: 'Our Team',
            description:
                'Meet the physicians, therapists and management scientists who teach our courses.',
        },
        sections: [
            {
                title: 'Page header',
                fields: [
                    {
                        key: 'header_title',
                        label: 'Title',
                        default: 'Our Team',
                    },
                ],
            },
            {
                title: 'Introduction',
                fields: [
                    {
                        key: 'intro_title',
                        label: 'Heading',
                        default: 'Meet our experts',
                    },
                    {
                        key: 'intro_text',
                        label: 'Text',
                        default:
                            'Practising physicians, therapists and management scientists who teach from years of work with patients and organisations.',
                        multiline: true,
                    },
                ],
            },
        ],
    },
    careers: {
        seo: {
            title: 'Careers',
            description:
                'Open roles for clinicians, educators and support staff who want to help people learn health sciences and management.',
        },
        sections: [
            {
                title: 'Page header',
                fields: [
                    { key: 'header_title', label: 'Title', default: 'Careers' },
                ],
            },
            {
                title: 'Job list',
                fields: [
                    {
                        key: 'list_title',
                        label: 'Heading',
                        default: 'Open positions',
                    },
                ],
            },
        ],
    },
};

const defaults = Object.fromEntries(
    Object.entries(PAGE_SCHEMAS).map(([kind, schema]) => [
        kind,
        Object.fromEntries(
            schema.sections.flatMap((section) =>
                section.fields.map((field) => [field.key, field.default]),
            ),
        ),
    ]),
) as Record<PageKind, Record<string, string>>;

/**
 * Text for a built-in page: the admin's wording when set (shown as written), otherwise the default,
 * translated. `seo` gives the <head> title and description the same way.
 */
export function usePageContent(kind: PageKind, page: PageProps | undefined) {
    const { t } = useTranslation();
    const text = (key: string, replace?: Record<string, string>) =>
        page?.content[key]?.trim() || t(defaults[kind][key] ?? key, replace);

    return {
        text,
        seo: {
            title: page?.meta_title || t(PAGE_SCHEMAS[kind].seo.title),
            description:
                page?.meta_description || t(PAGE_SCHEMAS[kind].seo.description),
            image: page?.og_image_url ?? null,
        },
    };
}
