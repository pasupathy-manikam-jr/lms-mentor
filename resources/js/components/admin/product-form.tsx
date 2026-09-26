import { useForm } from '@inertiajs/react';
import { Combobox } from '@/components/admin/combobox';
import { Field } from '@/components/admin/course-form';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { store, update } from '@/routes/admin/products';

/** A saved product as the form shows it; see Admin\ProductController::edit(). */
export type ProductFormValues = {
    id: number;
    title: string;
    summary: string;
    description: string;
    instructor_id: string;
    category_id: string;
    type: string;
    format: string;
    pricing_type: string;
    price: string;
    discount: boolean;
    discount_price: string;
    unlimited_stock: boolean;
    stock: string;
    image_url: string | null;
    meta_title?: string;
    meta_keywords?: string;
    meta_description?: string;
    og_title?: string;
    og_description?: string;
};

export type ProductFormOptions = {
    instructors: { id: number; name: string; title: string }[];
    categories: { id: number; name: string }[];
    /** Product types already in use, offered as suggestions. */
    types: string[];
};

/**
 * Form state for creating a product, or editing `product` when given. The editor splits the fields over
 * tabs, and every save sends all of them.
 */
export function useProductForm(product: ProductFormValues | null) {
    const {
        id: _id,
        image_url: _imageUrl,
        ...values
    }: ProductFormValues = product ?? {
        id: 0,
        image_url: null,
        title: '',
        summary: '',
        description: '',
        instructor_id: '',
        category_id: '',
        type: '',
        format: '',
        pricing_type: 'paid',
        price: '',
        discount: false,
        discount_price: '',
        unlimited_stock: true,
        stock: '',
    };

    return useForm({
        // The shared pricing fields also carry an expiry; products have none, so it stays lifetime.
        expiry_type: 'lifetime',
        expiry_months: '',
        ...values,
        thumbnail: null as File | null,
        remove_thumbnail: false,
    });
}

export type ProductForm = ReturnType<typeof useProductForm>;

/** Create the product, or save changes to it (a method-override POST, since files can't go in a PUT). */
export function submitProductForm(form: ProductForm, productId?: number) {
    if (productId) {
        form.transform((values) => ({ ...values, _method: 'put' }));
        form.post(update.url(productId), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () =>
                form.setData((current) => ({
                    ...current,
                    thumbnail: null,
                    remove_thumbnail: false,
                })),
        });
    } else {
        form.post(store.url());
    }
}

/** Title, summary and the rich-text description. */
export function ProductTextFields({ form }: { form: ProductForm }) {
    const { t } = useTranslation();
    const { data, setData, errors } = form;

    return (
        <>
            <Field
                label={t('Title')}
                htmlFor="title"
                required
                error={errors.title}
            >
                <Input
                    id="title"
                    value={data.title}
                    onChange={(event) => setData('title', event.target.value)}
                    placeholder={t('Enter product title')}
                    aria-invalid={!!errors.title}
                    className="h-10 rounded-lg"
                />
            </Field>
            <Field
                label={t('Summary')}
                htmlFor="summary"
                required
                error={errors.summary}
            >
                <Textarea
                    id="summary"
                    rows={3}
                    value={data.summary}
                    onChange={(event) => setData('summary', event.target.value)}
                    placeholder={t('A short summary for product cards')}
                    aria-invalid={!!errors.summary}
                    className="rounded-lg"
                />
            </Field>
            <Field
                label={t('Description')}
                htmlFor="description"
                error={errors.description}
            >
                <RichTextEditor
                    id="description"
                    value={data.description}
                    onChange={(html) => setData('description', html)}
                    placeholder={t('Enter description')}
                    invalid={!!errors.description}
                />
            </Field>
        </>
    );
}

/** Instructor, category, product type and format. */
export function ProductDetailFields({
    form,
    options,
}: {
    form: ProductForm;
    options: ProductFormOptions;
}) {
    const { t } = useTranslation();
    const { data, setData, errors } = form;

    return (
        <>
            <Field
                label={t('Instructor')}
                htmlFor="instructor_id"
                required
                error={errors.instructor_id}
            >
                <Combobox
                    id="instructor_id"
                    value={data.instructor_id}
                    options={options.instructors.map((instructor) => ({
                        value: String(instructor.id),
                        label: instructor.name,
                        hint: instructor.title,
                    }))}
                    onChange={(value) => setData('instructor_id', value)}
                    placeholder={t('Select an instructor')}
                    searchPlaceholder={t('Search instructors')}
                    emptyText={t('No instructor found.')}
                    invalid={!!errors.instructor_id}
                />
            </Field>
            <Field
                label={t('Category')}
                htmlFor="category_id"
                required
                error={errors.category_id}
            >
                <Combobox
                    id="category_id"
                    value={data.category_id}
                    options={options.categories.map((category) => ({
                        value: String(category.id),
                        label: category.name,
                    }))}
                    onChange={(value) => setData('category_id', value)}
                    placeholder={t('Select a category')}
                    searchPlaceholder={t('Search categories')}
                    emptyText={t('No category found.')}
                    invalid={!!errors.category_id}
                />
            </Field>
            <div className="grid gap-6 md:grid-cols-2">
                <Field
                    label={t('Product type')}
                    htmlFor="type"
                    required
                    error={errors.type}
                >
                    <Input
                        id="type"
                        list="product-types"
                        value={data.type}
                        onChange={(event) =>
                            setData('type', event.target.value)
                        }
                        placeholder={t('e.g. E-book')}
                        aria-invalid={!!errors.type}
                        className="h-10 rounded-lg"
                    />
                    <datalist id="product-types">
                        {options.types.map((type) => (
                            <option key={type} value={type} />
                        ))}
                    </datalist>
                </Field>
                <Field
                    label={t('Format')}
                    htmlFor="format"
                    error={errors.format}
                >
                    <Input
                        id="format"
                        value={data.format}
                        onChange={(event) =>
                            setData('format', event.target.value)
                        }
                        placeholder={t('e.g. PDF, 120 pages')}
                        aria-invalid={!!errors.format}
                        className="h-10 rounded-lg"
                    />
                </Field>
            </div>
        </>
    );
}

/** The demo's "Unlimited inventory" switch, with a stock count when it is off. */
export function ProductStockField({ form }: { form: ProductForm }) {
    const { t } = useTranslation();
    const { data, setData, errors } = form;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Checkbox
                    id="unlimited_stock"
                    checked={data.unlimited_stock}
                    onCheckedChange={(checked) =>
                        setData('unlimited_stock', checked === true)
                    }
                />
                <Label htmlFor="unlimited_stock">
                    {t('Unlimited inventory (no purchase limit)')}
                </Label>
            </div>
            {!data.unlimited_stock && (
                <Field
                    label={t('Stock')}
                    htmlFor="stock"
                    required
                    error={errors.stock}
                >
                    <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={data.stock}
                        onChange={(event) =>
                            setData('stock', event.target.value)
                        }
                        aria-invalid={!!errors.stock}
                        className="h-10 rounded-lg"
                    />
                </Field>
            )}
        </div>
    );
}
