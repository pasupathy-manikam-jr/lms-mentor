import { useForm } from '@inertiajs/react';
import { Combobox } from '@/components/admin/combobox';
import { Field } from '@/components/admin/course-form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';
import { store, update } from '@/routes/admin/exams';

/** A saved exam as the form shows it; see Admin\ExamController::edit(). */
export type ExamFormValues = {
    id: number;
    title: string;
    short_description: string;
    description: string;
    instructor_id: string;
    category_id: string;
    level: string;
    duration_hours: string;
    duration_minutes: string;
    pass_percentage: string;
    max_attempts: string;
    total_marks: string;
    pricing_type: string;
    price: string;
    discount: boolean;
    discount_price: string;
    expiry_type: string;
    expiry_months: string;
    image_url: string | null;
    meta_title?: string;
    meta_keywords?: string;
    meta_description?: string;
    og_title?: string;
    og_description?: string;
};

export type ExamFormOptions = {
    instructors: { id: number; name: string; title: string }[];
    categories: { id: number; name: string }[];
};

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

/**
 * Form state for creating an exam, or editing `exam` when given. The editor splits the fields over
 * tabs, and every save sends all of them.
 */
export function useExamForm(exam: ExamFormValues | null) {
    const {
        id: _id,
        image_url: _imageUrl,
        ...values
    } = exam ?? {
        id: 0,
        image_url: null,
        title: '',
        short_description: '',
        description: '',
        instructor_id: '',
        category_id: '',
        level: 'beginner',
        duration_hours: '0',
        duration_minutes: '0',
        pass_percentage: '0',
        max_attempts: '0',
        total_marks: '0',
        pricing_type: 'paid',
        price: '',
        discount: false,
        discount_price: '',
        expiry_type: 'lifetime',
        expiry_months: '',
    };

    return useForm({
        ...values,
        thumbnail: null as File | null,
        remove_thumbnail: false,
    });
}

export type ExamForm = ReturnType<typeof useExamForm>;

/**
 * Create the exam, or save changes to it (posted with a method override, since files can't be sent with
 * a real PUT).
 */
export function submitExamForm(form: ExamForm, examId?: number) {
    if (examId) {
        form.transform((values) => ({ ...values, _method: 'put' }));
        form.post(update.url(examId), {
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

/** Instructor, category and difficulty level. */
export function ExamDetailFields({
    form,
    options,
}: {
    form: ExamForm;
    options: ExamFormOptions;
}) {
    const { t } = useTranslation();
    const { data, setData, errors } = form;

    return (
        <>
            <Field
                label={t('Exam instructor')}
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
                <Field
                    label={t('Difficulty level')}
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
        </>
    );
}

/** Duration, pass mark (a percentage), attempts and total marks: the demo's Settings tab. */
export function ExamSettingsFields({
    form,
    hints = false,
}: {
    form: ExamForm;
    /** Show the explanations under Pass mark, Max attempts and Total marks, as the Settings tab does. */
    hints?: boolean;
}) {
    const { t } = useTranslation();
    const { data, setData, errors } = form;
    const numberInput = (
        name:
            | 'duration_hours'
            | 'duration_minutes'
            | 'pass_percentage'
            | 'max_attempts'
            | 'total_marks',
        max: number,
    ) => (
        <Input
            id={name}
            type="number"
            min="0"
            max={max}
            required
            value={data[name]}
            onChange={(event) => setData(name, event.target.value)}
            aria-invalid={!!errors[name]}
            className="h-10 rounded-lg"
        />
    );
    const hint = (text: string) =>
        hints && <p className="mt-1 text-xs text-muted-foreground">{text}</p>;

    return (
        <>
            <div className="grid gap-6 md:grid-cols-3">
                <Field
                    label={t('Duration (hours)')}
                    htmlFor="duration_hours"
                    required
                    error={errors.duration_hours}
                >
                    {numberInput('duration_hours', 23)}
                </Field>
                <Field
                    label={t('Duration (minutes)')}
                    htmlFor="duration_minutes"
                    required
                    error={errors.duration_minutes}
                >
                    {numberInput('duration_minutes', 59)}
                </Field>
                <Field
                    label={t('Pass mark')}
                    htmlFor="pass_percentage"
                    required
                    error={errors.pass_percentage}
                >
                    {numberInput('pass_percentage', 100)}
                    {hint(t('Students must score this percentage to pass'))}
                </Field>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <Field
                    label={t('Max attempts')}
                    htmlFor="max_attempts"
                    required
                    error={errors.max_attempts}
                >
                    {numberInput('max_attempts', 100)}
                    {hint(t('Maximum number of attempts allowed per student'))}
                </Field>
                <Field
                    label={t('Total marks')}
                    htmlFor="total_marks"
                    required
                    error={errors.total_marks}
                >
                    {numberInput('total_marks', 10000)}
                    {hint(t('Total marks for the entire exam'))}
                </Field>
            </div>
        </>
    );
}
