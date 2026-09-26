import { usePage } from '@inertiajs/react';
import { Wordmark } from '@/components/landing/site-header';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/use-translation';
import { about } from '@/routes';
import { index as careersIndex } from '@/routes/careers';
import { index as teamIndex } from '@/routes/team';

// '#' marks a page that doesn't exist yet.
const footerLinks = {
    Company: [
        { label: 'About', href: about.url() },
        { label: 'Our Team', href: teamIndex.url() },
        { label: 'Careers', href: careersIndex.url() },
        { label: 'Contact', href: '#' },
    ],
    Legal: [
        { label: 'Terms of Service', href: '#' },
        { label: 'Privacy Policy', href: '#' },
        { label: 'Cookie Policy', href: '#' },
        { label: 'Refunds', href: '#' },
    ],
};

const socials = ['Facebook', 'X', 'Instagram', 'LinkedIn'];

export function SiteFooter() {
    const { name, site } = usePage().props;
    const { t } = useTranslation();

    return (
        <footer className="border-t">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
                <div>
                    <Wordmark className="text-lg" />
                    <p className="mt-3 text-sm text-muted-foreground">
                        {t(
                            ':name is an online school where practitioners teach management science, medical sciences and traditional systems of medicine.',
                            { name },
                        )}
                    </p>
                    <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                        {socials.map((s) => (
                            <a
                                key={s}
                                href="#"
                                className="hover:text-foreground"
                            >
                                {s}
                            </a>
                        ))}
                    </div>
                </div>
                {Object.entries(footerLinks).map(([heading, links]) => (
                    <div key={heading}>
                        <p className="font-semibold">{t(heading)}</p>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                            {links.map((link) => (
                                <li key={t(link.label)}>
                                    <a
                                        href={link.href}
                                        className="hover:text-foreground"
                                    >
                                        {t(link.label)}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
                <div>
                    <p className="font-semibold">{t('Get in touch')}</p>
                    {/* Placeholder contact details: replace with your own. */}
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {site.address && (
                            <li className="whitespace-pre-line">
                                {site.address}
                            </li>
                        )}
                        {site.contact_email && (
                            <li>
                                <a
                                    href={`mailto:${site.contact_email}`}
                                    className="hover:underline"
                                >
                                    {site.contact_email}
                                </a>
                            </li>
                        )}
                        {site.contact_phone && (
                            <li>
                                <a
                                    href={`tel:${site.contact_phone.replace(/[^+\d]/g, '')}`}
                                    className="hover:underline"
                                >
                                    {site.contact_phone}
                                </a>
                            </li>
                        )}
                    </ul>
                    <p className="mt-4 text-sm text-muted-foreground">
                        {t('Secure payments with major cards and wallets.')}
                    </p>
                </div>
            </div>
            <p className="mx-auto max-w-3xl px-4 pb-8 text-center text-xs text-muted-foreground">
                {t(
                    'Courses are for education only and are not a substitute for diagnosis or treatment by a qualified practitioner.',
                )}
            </p>
            <Separator />
            <p className="py-6 text-center text-sm text-muted-foreground">
                {t('© :year :name. All rights reserved.', {
                    year: new Date().getFullYear(),
                    name,
                })}
            </p>
        </footer>
    );
}
