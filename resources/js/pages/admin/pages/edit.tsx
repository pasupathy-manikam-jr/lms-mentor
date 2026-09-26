import { Head, setLayoutProps, useForm } from '@inertiajs/react';
import { ExternalLink, Save } from 'lucide-react';
import type { FormEvent } from 'react';
import { Field, ImageField } from '@/components/admin/course-form';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { PAGE_SCHEMAS } from '@/lib/page-content';
import type { PageKind } from '@/lib/page-content';
import { dashboard } from '@/routes';
import { create, edit, index, store, update } from '@/routes/admin/pages';

type EditablePage = {
    id: number;
    slug: string;
    title: string;
    kind: PageKind | 'custom';
    content: Partial<Record<string, string>>;
    body: string | null;
    is_published: boolean;
    meta_title: string | null;
    meta_description: string | null;
    og_image_url: string | null;
    url: string;
};

/**
 * Edit a page. Built-in pages list their sections' wording (empty fields keep the built-in, translated
 * text); custom pages are a title, an address and a rich-text body. Both have SEO settings.
 */
export default function EditPage({ page }: { page: EditablePage | null }) {
    const { t } = useTranslation();
    const kind = page?.kind ?? 'custom';
    const schema = kind === 'custom' ? null : PAGE_SCHEMAS[kind];
    const form = useForm({
        title: page?.title ?? '',
        slug: page?.slug ?? '',
        body: page?.body ?? '',
        is_published: page?.is_published ?? true,
        content: { ...page?.content } as Record<string, string>,
        meta_title: page?.meta_title ?? '',
        meta_description: page?.meta_description ?? '',
        og_image: null as File | null,
        remove_og_image: false,
    });
    const { data, setData, errors } = form;
    const title = page
        ? kind === 'custom'
            ? page.title
            : t(page.title)
        : t('Create page');

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Pages', href: index() },
            page
                ? { title, href: edit(page.id) }
                : { title: 'Create page', href: create() },
        ],
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (!page) {
            form.post(store.url());

            return;
        }

        form.transform((values) => ({ ...values, _method: 'put' }));
        form.post(update.url(page.id), {
            preserveScroll: true,
            onSuccess: () =>
                form.setData((current) => ({
                    ...current,
                    og_image: null,
                    remove_og_image: false,
                })),
        });
    };

    return (
        <>
            <Head title={title} />
            <form
                onSubmit={submit}
                className="flex flex-1 flex-col gap-6 p-4 md:p-6"
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {title}
                    </h1>
                    <div className="flex gap-3">
                        {page && (
                            <Button variant="outline" asChild>
                                <a
                                    href={page.url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <ExternalLink />
                                    {t('View')}
                                </a>
                            </Button>
                        )}
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? <Spinner /> : <Save />}
                            {t(page ? 'Save changes' : 'Create page')}
                        </Button>
                    </div>
                </div>

                <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
                    <div className="min-w-0 space-y-6">
                        {schema ? (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    {t(
                                        'Leave a field empty to keep the built-in text, which is translated into every site language. Text you enter is shown as written.',
                                    )}
                                </p>
                                {schema.sections.map((section) => (
                                    <Card
                                        key={section.title}
                                        className="gap-5 p-4 sm:p-6"
                                    >
                                        <h2 className="font-semibold">
                                            {t(section.title)}
                                        </h2>
                                        {section.fields.map((field) => {
                                            const id = `content-${field.key}`;
                                            const Control = field.multiline
                                                ? Textarea
                                                : Input;

                                            return (
                                                <Field
                                                    key={field.key}
                                                    label={t(field.label, {
                                                        number: String(
                                                            field.number ?? '',
                                                        ),
                                                    })}
                                                    htmlFor={id}
                                                    error={
                                                        (
                                                            errors as Record<
                                                                string,
                                                                string
                                                            >
                                                        )[
                                                            `content.${field.key}`
                                                        ]
                                                    }
                                                >
                                                    <Control
                                                        id={id}
                                                        rows={3}
                                                        value={
                                                            data.content[
                                                                field.key
                                                            ] ?? ''
                                                        }
                                                        onChange={(event) =>
                                                            setData('content', {
                                                                ...data.content,
                                                                [field.key]:
                                                                    event.target
                                                                        .value,
                                                            })
                                                        }
                                                        placeholder={t(
                                                            field.default,
                                                        )}
                                                        className="rounded-lg"
                                                    />
                                                </Field>
                                            );
                                        })}
                                    </Card>
                                ))}
                            </>
                        ) : (
                            <Card className="gap-6 p-4 sm:p-6">
                                <Field
                                    label={t('Title')}
                                    htmlFor="title"
                                    required
                                    error={errors.title}
                                >
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(event) =>
                                            setData('title', event.target.value)
                                        }
                                        aria-invalid={!!errors.title}
                                        className="h-10 rounded-lg"
                                    />
                                </Field>
                                <Field
                                    label={t('Page address')}
                                    htmlFor="slug"
                                    error={errors.slug}
                                >
                                    <div className="flex items-center rounded-lg border ps-3 text-sm text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
                                        <span className="shrink-0">
                                            /pages/
                                        </span>
                                        <input
                                            id="slug"
                                            value={data.slug}
                                            onChange={(event) =>
                                                setData(
                                                    'slug',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder={t(
                                                'Made from the title',
                                            )}
                                            className="h-10 min-w-0 flex-1 bg-transparent pe-3 text-foreground outline-none"
                                        />
                                    </div>
                                </Field>
                                <Field
                                    label={t('Content')}
                                    htmlFor="body"
                                    required
                                    error={errors.body}
                                >
                                    <RichTextEditor
                                        id="body"
                                        value={data.body}
                                        onChange={(html) =>
                                            setData('body', html)
                                        }
                                        placeholder={t(
                                            'Write the page content here…',
                                        )}
                                        invalid={!!errors.body}
                                    />
                                </Field>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="is_published"
                                        checked={data.is_published}
                                        onCheckedChange={(checked) =>
                                            setData(
                                                'is_published',
                                                checked === true,
                                            )
                                        }
                                    />
                                    <Label htmlFor="is_published">
                                        {t('Published (visible on the site)')}
                                    </Label>
                                </div>
                            </Card>
                        )}
                    </div>

                    <Card className="gap-5 p-4 sm:p-6 lg:sticky lg:top-4">
                        <CardHeader className="p-0">
                            <CardTitle>{t('SEO')}</CardTitle>
                            <CardDescription>
                                {t(
                                    'How the page appears in search results and when shared.',
                                )}
                            </CardDescription>
                        </CardHeader>
                        <Field
                            label={t('Meta title')}
                            htmlFor="meta_title"
                            error={errors.meta_title}
                        >
                            <Input
                                id="meta_title"
                                value={data.meta_title}
                                onChange={(event) =>
                                    setData('meta_title', event.target.value)
                                }
                                placeholder={
                                    schema ? t(schema.seo.title) : data.title
                                }
                                className="h-10 rounded-lg"
                            />
                        </Field>
                        <Field
                            label={t('Meta description')}
                            htmlFor="meta_description"
                            error={errors.meta_description}
                        >
                            <Textarea
                                id="meta_description"
                                rows={4}
                                value={data.meta_description}
                                onChange={(event) =>
                                    setData(
                                        'meta_description',
                                        event.target.value,
                                    )
                                }
                                placeholder={
                                    schema ? t(schema.seo.description) : ''
                                }
                                className="rounded-lg"
                            />
                        </Field>
                        <ImageField
                            form={form}
                            name="og_image"
                            label={t('Share image')}
                            currentUrl={page?.og_image_url ?? null}
                        />
                    </Card>
                </div>
            </form>
        </>
    );
}
