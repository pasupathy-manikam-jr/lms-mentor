import { Head } from '@inertiajs/react';

/**
 * <head> tags for a page managed from Frontend → Pages: title, description and the share image.
 */
export function PageHead({
    seo,
}: {
    seo: { title: string; description: string; image: string | null };
}) {
    return (
        <Head title={seo.title}>
            <meta name="description" content={seo.description} />
            <meta property="og:title" content={seo.title} />
            <meta property="og:description" content={seo.description} />
            {seo.image && <meta property="og:image" content={seo.image} />}
        </Head>
    );
}
