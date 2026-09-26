import { useForm } from '@inertiajs/react';
import { Bot, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Combobox } from '@/components/admin/combobox';
import type { ComboboxOption } from '@/components/admin/combobox';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { store, update } from '@/routes/admin/courses';

/** A saved course as the form shows it; see CourseController::edit(). */
export type CourseFormValues = {
    id: number;
    title: string;
    short_description: string;
    description: string;
    instructor_id: string;
    category_id: string;
    subcategory_id: string;
    level: string;
    language: string;
    pricing_type: string;
    price: string;
    discount: boolean;
    discount_price: string;
    expiry_type: string;
    expiry_months: string;
    drip_content: string;
    image_url: string | null;
    banner_url?: string | null;
    /** video_url or video; the form keeps it even when no preview is set. */
    preview_type?: string;
    preview_url?: string;
    /** Public URL of an uploaded preview video, shown in the Media tab. */
    preview_file_url?: string | null;
    meta_title?: string;
    meta_keywords?: string;
    meta_description?: string;
    og_title?: string;
    og_description?: string;
};

/** Choices for the form's selects, shared by the create page and the editor. */
export type CourseFormOptions = {
    instructors: { id: number; name: string; title: string }[];
    categories: {
        id: number;
        name: string;
        children: { id: number; parent_id: number; name: string }[];
    }[];
    /** Teaching languages keyed by code. */
    languages: Record<string, string>;
};

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

/**
 * Form state for creating a course, or editing `course` when given. The editor splits the fields over
 * several tabs, but every save sends all of them, since the server validates the course as a whole.
 */
export function useCourseForm(course: CourseFormValues | null) {
    const {
        id: _id,
        image_url: _imageUrl,
        banner_url: _bannerUrl,
        preview_file_url: _previewFileUrl,
        ...values
    } = course ?? {
        id: 0,
        image_url: null,
        banner_url: null,
        preview_file_url: null,
        title: '',
        short_description: '',
        description: '',
        instructor_id: '',
        category_id: '',
        subcategory_id: '',
        level: 'beginner',
        language: 'en',
        pricing_type: 'paid',
        price: '',
        discount: false,
        discount_price: '',
        expiry_type: 'lifetime',
        expiry_months: '',
        drip_content: '0',
    };

    return useForm({
        preview_type: 'video_url',
        preview_url: '',
        ...values,
        thumbnail: null as File | null,
        remove_thumbnail: false,
        banner: null as File | null,
        remove_banner: false,
        preview_file: null as File | null,
    });
}

export type CourseForm = ReturnType<typeof useCourseForm>;

/**
 * Create the course, or save changes to it. Files can't be sent with a real PUT, so an update is
 * posted with Laravel's method override.
 */
export function submitCourseForm(form: CourseForm, courseId?: number) {
    if (courseId) {
        form.transform((values) => ({ ...values, _method: 'put' }));
        form.post(update.url(courseId), {
            preserveScroll: true,
            preserveState: true,
            // Clear pending uploads; the page now shows the saved files.
            onSuccess: () =>
                form.setData((current) => ({
                    ...current,
                    thumbnail: null,
                    remove_thumbnail: false,
                    banner: null,
                    remove_banner: false,
                    preview_file: null,
                })),
        });
    } else {
        form.post(store.url());
    }
}

/** Title, short description and the rich-text description. */
export function CourseTextFields({
    form,
    placeholders,
}: {
    form: TextForm;
    placeholders?: { title?: string; short?: string; description?: string };
}) {
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
                    placeholder={placeholders?.title ?? t('Enter title')}
                    aria-invalid={!!errors.title}
                    className="h-10 rounded-lg"
                />
            </Field>

            <Field
                label={t('Short description')}
                htmlFor="short_description"
                error={errors.short_description}
            >
                <Textarea
                    id="short_description"
                    rows={5}
                    value={data.short_description}
                    onChange={(event) =>
                        setData('short_description', event.target.value)
                    }
                    placeholder={
                        placeholders?.short ?? t('Enter short description')
                    }
                    aria-invalid={!!errors.short_description}
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
                    placeholder={
                        placeholders?.description ?? t('Enter description')
                    }
                    invalid={!!errors.description}
                />
            </Field>
        </>
    );
}

/** Instructor, category, level and language. */
export function CourseDetailFields({
    form,
    options,
}: {
    form: CourseForm;
    options: CourseFormOptions;
}) {
    const { t } = useTranslation();
    const { data, setData, errors } = form;

    const instructorOptions: ComboboxOption[] = options.instructors.map(
        (instructor) => ({
            value: String(instructor.id),
            label: instructor.name,
            hint: instructor.title,
        }),
    );

    // Subcategories are listed under their parent; the value carries both ids as "parent:child".
    const categoryOptions: ComboboxOption[] = options.categories.flatMap(
        (category) => [
            { value: String(category.id), label: category.name },
            ...category.children.map((child) => ({
                value: `${category.id}:${child.id}`,
                label: child.name,
                selectedLabel: `${category.name} / ${child.name}`,
                nested: true,
            })),
        ],
    );

    const languageOptions: ComboboxOption[] = Object.entries(
        options.languages,
    ).map(([code, name]) => ({ value: code, label: name }));

    const categoryError = errors.category_id ?? errors.subcategory_id;

    return (
        <>
            <Field
                label={t('Course instructor')}
                htmlFor="instructor_id"
                required
                error={errors.instructor_id}
            >
                <Combobox
                    id="instructor_id"
                    value={data.instructor_id}
                    options={instructorOptions}
                    onChange={(value) => setData('instructor_id', value)}
                    placeholder={t('Select an instructor')}
                    searchPlaceholder={t('Search instructors')}
                    emptyText={t('No instructor found.')}
                    invalid={!!errors.instructor_id}
                />
            </Field>

            <div className="grid gap-6 md:grid-cols-2">
                <Field
                    label={t('Category')}
                    htmlFor="category_id"
                    required
                    error={categoryError}
                >
                    <Combobox
                        id="category_id"
                        value={
                            data.subcategory_id
                                ? `${data.category_id}:${data.subcategory_id}`
                                : data.category_id
                        }
                        options={categoryOptions}
                        onChange={(value) => {
                            const [categoryId, subcategoryId = ''] =
                                value.split(':');
                            setData((current) => ({
                                ...current,
                                category_id: categoryId,
                                subcategory_id: subcategoryId,
                            }));
                        }}
                        placeholder={t('Select a category')}
                        searchPlaceholder={t('Search categories')}
                        emptyText={t('No category found.')}
                        invalid={!!categoryError}
                    />
                </Field>

                <Field
                    label={t('Course level')}
                    htmlFor="level"
                    required
                    error={errors.level}
                >
                    <Select
                        value={data.level}
                        onValueChange={(value) => setData('level', value)}
                    >
                        <SelectTrigger
                            id="level"
                            className="w-full rounded-lg data-[size=default]:h-10"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {LEVELS.map((level) => (
                                <SelectItem key={level} value={level}>
                                    {t(
                                        level.charAt(0).toUpperCase() +
                                            level.slice(1),
                                    )}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>
            </div>

            <Field
                label={t('Course language')}
                htmlFor="language"
                required
                error={errors.language}
            >
                <Combobox
                    id="language"
                    value={data.language}
                    options={languageOptions}
                    onChange={(value) => setData('language', value)}
                    placeholder={t('Select a language')}
                    searchPlaceholder={t('Search languages')}
                    emptyText={t('No language found.')}
                    invalid={!!errors.language}
                />
            </Field>
        </>
    );
}

/** Free or paid (with an optional discount), and how long access lasts. */
/**
 * The part of an Inertia form a shared field group needs. Courses and exams use the same field names, so
 * the same components serve both forms.
 */
type FormSlice<T> = {
    data: T;
    setData: <K extends keyof T>(key: K, value: T[K]) => void;
    errors: Partial<Record<keyof T, string>>;
};

/** The fields CoursePricingFields edits; exams use the same names, so both forms can share it. */
type PricingState = {
    pricing_type: string;
    price: string;
    discount: boolean;
    discount_price: string;
    expiry_type: string;
    expiry_months: string;
};

export type PricingForm = FormSlice<PricingState>;

export type TextForm = FormSlice<{
    title: string;
    short_description: string;
    description: string;
}>;

export type SeoForm = FormSlice<{
    meta_title?: string;
    meta_keywords?: string;
    meta_description?: string;
    og_title?: string;
    og_description?: string;
}>;

export function CoursePricingFields({
    form,
    priceLabel,
    showExpiry = true,
}: {
    form: PricingForm;
    /** Placeholder for the price field, e.g. "Enter your exam price ($0)". */
    priceLabel?: string;
    /** Store products have no access period. */
    showExpiry?: boolean;
}) {
    const { t } = useTranslation();
    const { data, setData, errors } = form;

    return (
        <>
            <Field
                label={t('Pricing type')}
                required
                error={errors.pricing_type}
            >
                <ChoiceGroup
                    name="pricing_type"
                    value={data.pricing_type}
                    onChange={(value) => setData('pricing_type', value)}
                    choices={[
                        { value: 'free', label: t('Free') },
                        { value: 'paid', label: t('Paid') },
                    ]}
                />
                {data.pricing_type === 'paid' && (
                    <div className="mt-4 space-y-4">
                        <Field
                            label={t('Price')}
                            htmlFor="price"
                            required
                            error={errors.price}
                        >
                            <Input
                                id="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.price}
                                onChange={(event) =>
                                    setData('price', event.target.value)
                                }
                                placeholder={
                                    priceLabel ??
                                    t('Enter your course price ($0)')
                                }
                                aria-invalid={!!errors.price}
                                className="h-10 rounded-lg"
                            />
                        </Field>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="discount"
                                checked={data.discount}
                                onCheckedChange={(checked) =>
                                    setData('discount', checked === true)
                                }
                            />
                            <Label htmlFor="discount">
                                {t('Discounted price')}
                            </Label>
                        </div>
                        {data.discount && (
                            <Field
                                label={t('Discounted price')}
                                htmlFor="discount_price"
                                required
                                error={errors.discount_price}
                            >
                                <Input
                                    id="discount_price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.discount_price}
                                    onChange={(event) =>
                                        setData(
                                            'discount_price',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'Enter the discounted price',
                                    )}
                                    aria-invalid={!!errors.discount_price}
                                    className="h-10 rounded-lg"
                                />
                            </Field>
                        )}
                    </div>
                )}
            </Field>

            {showExpiry && (
                <Field
                    label={t('Expiry period type')}
                    error={errors.expiry_type}
                >
                    <ChoiceGroup
                        name="expiry_type"
                        value={data.expiry_type}
                        onChange={(value) => setData('expiry_type', value)}
                        choices={[
                            { value: 'lifetime', label: t('Lifetime') },
                            { value: 'limited_time', label: t('Limited time') },
                        ]}
                    />
                    {data.expiry_type === 'limited_time' && (
                        <div className="mt-4">
                            <Field
                                label={t('Number of months')}
                                htmlFor="expiry_months"
                                required
                                error={errors.expiry_months}
                            >
                                <Input
                                    id="expiry_months"
                                    type="number"
                                    min="1"
                                    max="120"
                                    value={data.expiry_months}
                                    onChange={(event) =>
                                        setData(
                                            'expiry_months',
                                            event.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'Access lasts this many months after enrolling',
                                    )}
                                    aria-invalid={!!errors.expiry_months}
                                    className="h-10 rounded-lg"
                                />
                            </Field>
                        </div>
                    )}
                </Field>
            )}
        </>
    );
}

/** Thumbnail upload, with the current image when editing. */
export function CourseMediaFields({
    form,
    imageUrl,
}: {
    form: CourseForm;
    imageUrl?: string | null;
}) {
    const { t } = useTranslation();
    const { data, setData, errors } = form;

    return (
        <Field
            label={t('Thumbnail')}
            htmlFor="thumbnail"
            error={errors.thumbnail}
        >
            <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(event) =>
                    setData('thumbnail', event.target.files?.[0] ?? null)
                }
                aria-invalid={!!errors.thumbnail}
                className="h-10 cursor-pointer rounded-lg"
            />
            {imageUrl && !data.thumbnail && (
                <img
                    src={imageUrl}
                    alt={t('Current thumbnail')}
                    className="mt-3 aspect-video w-64 rounded-lg border object-cover"
                />
            )}
        </Field>
    );
}

/**
 * The editor's Media tab, following the demo: thumbnail (the current file can be removed), banner, and a
 * preview video from a YouTube/Vimeo link or an uploaded file.
 */
export function CourseMediaTab({
    form,
    course,
}: {
    form: CourseForm;
    course: CourseFormValues;
}) {
    const { t } = useTranslation();
    const { data, setData, errors } = form;

    return (
        <>
            <ImageField
                form={form}
                name="thumbnail"
                label={t('Thumbnail')}
                currentUrl={course.image_url}
            />
            <Button
                type="button"
                variant="outline"
                disabled
                className="border-violet-200 text-violet-700 dark:border-violet-800 dark:text-violet-400"
            >
                <Bot />
                {t('Generate with AI')}
                <span className="text-xs opacity-80">{t('Soon')}</span>
            </Button>
            <ImageField
                form={form}
                name="banner"
                label={t('Banner')}
                currentUrl={course.banner_url ?? null}
            />

            <Separator />

            <Field label={t('Preview video type')} error={errors.preview_type}>
                <ChoiceGroup
                    name="preview_type"
                    value={data.preview_type}
                    onChange={(value) => setData('preview_type', value)}
                    choices={[
                        { value: 'video_url', label: t('Video URL') },
                        { value: 'video', label: t('Video file') },
                    ]}
                />
            </Field>

            {data.preview_type === 'video_url' ? (
                <Field
                    label={t('Preview video')}
                    htmlFor="preview_url"
                    error={errors.preview_url}
                >
                    <Input
                        id="preview_url"
                        type="url"
                        value={data.preview_url}
                        onChange={(event) =>
                            setData('preview_url', event.target.value)
                        }
                        placeholder={t('Enter your video url')}
                        aria-invalid={!!errors.preview_url}
                        className="h-10 rounded-lg"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t('Supported URL: YouTube or Vimeo')}
                    </p>
                </Field>
            ) : (
                <Field
                    label={t('Preview video')}
                    htmlFor="preview_file"
                    error={errors.preview_file}
                >
                    {course.preview_file_url && !data.preview_file && (
                        <video
                            src={course.preview_file_url}
                            controls
                            className="mb-3 aspect-video w-full max-w-md rounded-lg border bg-black"
                        />
                    )}
                    <Input
                        id="preview_file"
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={(event) =>
                            setData(
                                'preview_file',
                                event.target.files?.[0] ?? null,
                            )
                        }
                        aria-invalid={!!errors.preview_file}
                        className="h-10 cursor-pointer rounded-lg"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t('MP4, WebM or MOV, up to 45 MB.')}
                    </p>
                </Field>
            )}
        </>
    );
}

/**
 * An image upload that shows the current file, like the demo: a row with a preview, its name, and a
 * remove button that brings back the file picker.
 */
export function ImageField({
    form,
    name,
    label,
    currentUrl,
}: {
    form: FormSlice<{
        thumbnail?: File | null;
        remove_thumbnail?: boolean;
        banner?: File | null;
        remove_banner?: boolean;
        og_image?: File | null;
        remove_og_image?: boolean;
    }>;
    name: 'thumbnail' | 'banner' | 'og_image';
    label: string;
    currentUrl: string | null;
}) {
    const { t } = useTranslation();
    const removeKey = `remove_${name}` as const;
    const showCurrent =
        !!currentUrl && !form.data[removeKey] && !form.data[name];

    return (
        <Field label={label} htmlFor={name} error={form.errors[name]}>
            {showCurrent ? (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted p-1">
                    <div className="flex min-w-0 items-center gap-2">
                        <img
                            src={currentUrl}
                            alt=""
                            className="h-8 w-14 shrink-0 rounded object-cover"
                        />
                        <span className="truncate text-xs text-muted-foreground">
                            {t('Current file: :name', {
                                name: currentUrl.split('/').pop() ?? '',
                            })}
                        </span>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={t('Remove :name', { name: label })}
                        onClick={() => form.setData(removeKey, true)}
                    >
                        <X />
                    </Button>
                </div>
            ) : (
                <Input
                    id={name}
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                        form.setData(name, event.target.files?.[0] ?? null)
                    }
                    aria-invalid={!!form.errors[name]}
                    className="h-10 cursor-pointer rounded-lg"
                />
            )}
        </Field>
    );
}

/**
 * The editor's SEO tab, following the demo. Empty fields fall back to the course title and short
 * description on the course page.
 */
export function CourseSeoFields({ form }: { form: SeoForm }) {
    const { t } = useTranslation();
    const { data, setData, errors } = form;
    const fields: {
        name:
            | 'meta_title'
            | 'meta_keywords'
            | 'meta_description'
            | 'og_title'
            | 'og_description';
        label: string;
        multiline: boolean;
    }[] = [
        { name: 'meta_title', label: t('Meta title'), multiline: false },
        { name: 'meta_keywords', label: t('Meta keywords'), multiline: true },
        {
            name: 'meta_description',
            label: t('Meta description'),
            multiline: true,
        },
        { name: 'og_title', label: t('OG title'), multiline: false },
        { name: 'og_description', label: t('OG description'), multiline: true },
    ];

    return (
        <>
            {fields.map(({ name, label, multiline }) => (
                <Field
                    key={name}
                    label={label}
                    htmlFor={name}
                    error={errors[name]}
                >
                    {multiline ? (
                        <Textarea
                            id={name}
                            rows={3}
                            value={data[name] ?? ''}
                            onChange={(event) =>
                                setData(name, event.target.value)
                            }
                            placeholder={label}
                            aria-invalid={!!errors[name]}
                            className="min-h-16 rounded-lg [field-sizing:fixed]"
                        />
                    ) : (
                        <Input
                            id={name}
                            value={data[name] ?? ''}
                            onChange={(event) =>
                                setData(name, event.target.value)
                            }
                            placeholder={label}
                            aria-invalid={!!errors[name]}
                            className="h-10 rounded-lg"
                        />
                    )}
                </Field>
            ))}
        </>
    );
}

/** Whether lessons unlock over time. */
export function CourseDripField({ form }: { form: CourseForm }) {
    const { t } = useTranslation();
    const { data, setData, errors } = form;

    return (
        <Field
            label={t('Enable drip content')}
            required
            error={errors.drip_content}
        >
            <ChoiceGroup
                name="drip_content"
                value={data.drip_content}
                onChange={(value) => setData('drip_content', value)}
                choices={[
                    { value: '0', label: t('Off') },
                    { value: '1', label: t('On') },
                ]}
            />
        </Field>
    );
}

export function Field({
    label,
    htmlFor,
    required,
    error,
    children,
}: {
    label: string;
    htmlFor?: string;
    required?: boolean;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <Label htmlFor={htmlFor} className="mb-2 inline-block">
                {label}
                {required && ' *'}
            </Label>
            {children}
            <InputError message={error} className="mt-2" />
        </div>
    );
}

export function ChoiceGroup({
    name,
    value,
    onChange,
    choices,
}: {
    name: string;
    value: string;
    onChange: (value: string) => void;
    choices: { value: string; label: string }[];
}) {
    return (
        <div role="radiogroup" className="flex items-center gap-6 pt-2 pb-1">
            {choices.map((choice) => (
                <label
                    key={choice.value}
                    className="flex cursor-pointer items-center gap-2 text-sm font-medium"
                >
                    <input
                        type="radio"
                        name={name}
                        value={choice.value}
                        checked={value === choice.value}
                        onChange={() => onChange(choice.value)}
                        className="size-4 cursor-pointer accent-primary"
                    />
                    {choice.label}
                </label>
            ))}
        </div>
    );
}
