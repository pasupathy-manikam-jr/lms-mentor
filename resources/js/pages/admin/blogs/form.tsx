import { Head, setLayoutProps, useForm } from '@inertiajs/react';
import { ImageIcon, Save } from 'lucide-react';
import type { FormEvent } from 'react';
import { Combobox } from '@/components/admin/combobox';
import { Field, ImageField } from '@/components/admin/course-form';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import { create, edit, index, store, update } from '@/routes/admin/blogs';

type BlogStatus = 'draft' | 'published';

type BlogPost = {
    id: number;
    title: string;
    slug: string;
    category_id: string;
    status: BlogStatus;
    keywords: string | null;
    body: string | null;
    image_url: string | null;
    banner_url: string | null;
};

/**
 * Create Blog and Update Blog, following the Mentor demo: one form with title, category, status,
 * keywords, the rich-text description and the banner and thumbnail images.
 */
export default function BlogForm({
    post,
    categories,
}: {
    post: BlogPost | null;
    categories: { id: number; name: string }[];
}) {
    const { t } = useTranslation();
    const form = useForm({
        title: post?.title ?? '',
        category_id: post?.category_id ?? '',
        status: post?.status ?? ('draft' as BlogStatus),
        keywords: post?.keywords ?? '',
        body: post?.body ?? '',
        banner: null as File | null,
        remove_banner: false,
        thumbnail: null as File | null,
        remove_thumbnail: false,
    });
    const { data, setData, errors } = form;
    const heading = post ? 'Update blog' : 'Create blog';

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Blog', href: index() },
            post
                ? { title: post.title, href: edit(post.id) }
                : { title: 'Create blog', href: create() },
        ],
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (!post) {
            form.post(store.url());

            return;
        }

        form.transform((values) => ({ ...values, _method: 'put' }));
        form.post(update.url(post.id), {
            preserveScroll: true,
            onSuccess: () =>
                form.setData((current) => ({
                    ...current,
                    banner: null,
                    remove_banner: false,
                    thumbnail: null,
                    remove_thumbnail: false,
                })),
        });
    };

    return (
        <>
            <Head title={t(heading)} />
            <form
                onSubmit={submit}
                className="flex flex-1 flex-col gap-6 p-4 md:p-6"
            >
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t(heading)}
                </h1>

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
                            placeholder={t('Title')}
                            aria-invalid={!!errors.title}
                            className="h-10 rounded-lg"
                        />
                    </Field>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Field
                            label={t('Category')}
                            htmlFor="category_id"
                            required
                            error={errors.category_id}
                        >
                            <Combobox
                                id="category_id"
                                value={data.category_id}
                                options={categories.map((category) => ({
                                    value: String(category.id),
                                    label: category.name,
                                }))}
                                onChange={(value) =>
                                    setData('category_id', value)
                                }
                                placeholder={t('Select a category')}
                                searchPlaceholder={t('Search categories')}
                                emptyText={t('No category found.')}
                                invalid={!!errors.category_id}
                            />
                        </Field>
                        <Field
                            label={t('Status')}
                            htmlFor="status"
                            required
                            error={errors.status}
                        >
                            <Select
                                value={data.status}
                                onValueChange={(value) =>
                                    setData('status', value as BlogStatus)
                                }
                            >
                                <SelectTrigger
                                    id="status"
                                    className="h-10 w-full rounded-lg"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">
                                        {t('Draft')}
                                    </SelectItem>
                                    <SelectItem value="published">
                                        {t('Published')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>
                    <Field
                        label={t('Keywords')}
                        htmlFor="keywords"
                        error={errors.keywords}
                    >
                        <Input
                            id="keywords"
                            value={data.keywords}
                            onChange={(event) =>
                                setData('keywords', event.target.value)
                            }
                            placeholder={t(
                                'Comma-separated, e.g. ayurveda, diet',
                            )}
                            aria-invalid={!!errors.keywords}
                            className="h-10 rounded-lg"
                        />
                    </Field>
                    <Field
                        label={t('Description')}
                        htmlFor="body"
                        required
                        error={errors.body}
                    >
                        <RichTextEditor
                            id="body"
                            value={data.body}
                            onChange={(html) => setData('body', html)}
                            placeholder={t('Write your blog content here…')}
                            invalid={!!errors.body}
                        />
                    </Field>
                </Card>

                <Card className="gap-6 p-4 sm:p-6">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                            <ImageIcon className="size-5" />
                            {t('Media files')}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {t(
                                'Upload banner and thumbnail images for your blog',
                            )}
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        <ImageField
                            form={form}
                            name="banner"
                            label={t('Blog banner')}
                            currentUrl={post?.banner_url ?? null}
                        />
                        <ImageField
                            form={form}
                            name="thumbnail"
                            label={t('Blog thumbnail')}
                            currentUrl={post?.image_url ?? null}
                        />
                    </div>
                </Card>

                <div>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? <Spinner /> : <Save />}
                        {t(post ? 'Save changes' : 'Create blog')}
                    </Button>
                </div>
            </form>
        </>
    );
}
