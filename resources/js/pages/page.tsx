import { PageHead } from '@/components/landing/page-head';
import { PageHeader } from '@/components/landing/page-header';
import { SiteFooter } from '@/components/landing/site-footer';
import { SiteHeader } from '@/components/landing/site-header';

/**
 * A custom page created in Frontend → Pages: the title banner and the page's rich-text body.
 */
export default function CustomPage({
    page,
}: {
    page: {
        title: string;
        body: string | null;
        meta_title: string | null;
        meta_description: string | null;
        og_image_url: string | null;
    };
}) {
    return (
        <>
            <PageHead
                seo={{
                    title: page.meta_title || page.title,
                    description: page.meta_description ?? '',
                    image: page.og_image_url,
                }}
            />
            <div className="min-h-screen bg-background pt-18 text-foreground">
                <SiteHeader />
                <main>
                    <PageHeader title={page.title} />
                    {page.body && (
                        <article
                            className="rich-text mx-auto max-w-3xl px-4 py-16 text-base leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: page.body }}
                        />
                    )}
                </main>
                <SiteFooter />
            </div>
        </>
    );
}
