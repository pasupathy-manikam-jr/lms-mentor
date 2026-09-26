import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowDownUp,
    ArrowUp,
    EllipsisVertical,
    Pencil,
    Plus,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import {
    CategoryIcon,
    categoryIcons,
} from '@/components/landing/category-icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import {
    destroy,
    index,
    sort,
    store,
    update,
} from '@/routes/admin/course-categories';

type Subcategory = { id: number; name: string; slug: string; icon: string };

type Category = Subcategory & {
    is_default: boolean;
    children: Subcategory[];
};

/** What a dialog is doing: adding (optionally under a parent), editing, or deleting. */
type DialogState =
    | { mode: 'add'; parent: Category | null }
    | { mode: 'edit'; category: Subcategory }
    | { mode: 'delete'; category: Subcategory; isParent: boolean }
    | { mode: 'sort' }
    | null;

export default function CourseCategories({
    categories,
}: {
    categories: Category[];
}) {
    const { t } = useTranslation();
    const [dialog, setDialog] = useState<DialogState>(null);
    const close = () => setDialog(null);
    const sortable = categories.filter((category) => !category.is_default);

    return (
        <>
            <Head title={t('Categories')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t('Categories')}
                    </h1>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setDialog({ mode: 'sort' })}
                            disabled={sortable.length < 2}
                        >
                            <ArrowDownUp />
                            {t('Sort categories')}
                        </Button>
                        <Button
                            onClick={() =>
                                setDialog({ mode: 'add', parent: null })
                            }
                        >
                            <Plus />
                            {t('Add category')}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) =>
                        category.is_default ? (
                            <DefaultCategoryCard
                                key={category.id}
                                category={category}
                            />
                        ) : (
                            <CategoryCard
                                key={category.id}
                                category={category}
                                onDialog={setDialog}
                            />
                        ),
                    )}
                </div>
            </div>

            {dialog?.mode === 'add' && (
                <CategoryFormDialog parent={dialog.parent} onClose={close} />
            )}
            {dialog?.mode === 'edit' && (
                <CategoryFormDialog
                    category={dialog.category}
                    onClose={close}
                />
            )}
            {dialog?.mode === 'delete' && (
                <DeleteCategoryDialog
                    category={dialog.category}
                    isParent={dialog.isParent}
                    defaultName={
                        categories.find((c) => c.is_default)?.name ?? 'Default'
                    }
                    onClose={close}
                />
            )}
            {dialog?.mode === 'sort' && (
                <SortCategoriesDialog categories={sortable} onClose={close} />
            )}
        </>
    );
}

CourseCategories.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Course categories', href: index() },
    ],
};

function IconBadge({
    icon,
    size = 'md',
}: {
    icon: string;
    size?: 'sm' | 'md';
}) {
    return (
        <span
            className={cn(
                'flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
                size === 'md' ? 'size-10' : 'size-7',
            )}
        >
            <CategoryIcon
                name={icon}
                className={size === 'md' ? 'size-5' : 'size-3.5'}
                aria-hidden
            />
        </span>
    );
}

function DefaultCategoryCard({ category }: { category: Category }) {
    const { t } = useTranslation();

    return (
        <Card className="gap-4 p-6">
            <div className="flex items-center gap-3">
                <IconBadge icon={category.icon} />
                <div>
                    <h2 className="text-lg leading-tight font-semibold">
                        {t(category.name)}
                    </h2>
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        <ShieldCheck className="size-3" aria-hidden />
                        {t('Protected category')}
                    </span>
                </div>
            </div>
            <Separator />
            <p className="text-sm leading-relaxed text-muted-foreground">
                {t(
                    'When a category is deleted, its courses, exams, products and posts move to this default category. So the default category cannot be edited or removed.',
                )}
            </p>
        </Card>
    );
}

function CategoryCard({
    category,
    onDialog,
}: {
    category: Category;
    onDialog: (dialog: DialogState) => void;
}) {
    const { t } = useTranslation();

    return (
        <Card className="gap-4 p-6">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <IconBadge icon={category.icon} />
                    <h2 className="text-lg leading-tight font-semibold">
                        {category.name}
                    </h2>
                </div>
                <ActionsMenu
                    label={t('Actions for :name', { name: category.name })}
                    onEdit={() => onDialog({ mode: 'edit', category })}
                    onAddChild={() =>
                        onDialog({ mode: 'add', parent: category })
                    }
                    onDelete={() =>
                        onDialog({ mode: 'delete', category, isParent: true })
                    }
                />
            </div>
            <Separator />
            {category.children.length > 0 ? (
                <div className="space-y-2">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        {t('Subcategories')}
                    </p>
                    <ul className="space-y-2">
                        {category.children.map((child) => (
                            <li
                                key={child.id}
                                className="flex items-center justify-between rounded-lg border bg-muted/30 py-1 ps-3 pe-1 transition-colors hover:bg-muted/60"
                            >
                                <span className="flex items-center gap-2 text-sm font-medium">
                                    <CategoryIcon
                                        name={child.icon}
                                        className="size-3.5 text-muted-foreground"
                                        aria-hidden
                                    />
                                    {child.name}
                                </span>
                                <ActionsMenu
                                    label={t('Actions for :name', {
                                        name: child.name,
                                    })}
                                    onEdit={() =>
                                        onDialog({
                                            mode: 'edit',
                                            category: child,
                                        })
                                    }
                                    onDelete={() =>
                                        onDialog({
                                            mode: 'delete',
                                            category: child,
                                            isParent: false,
                                        })
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="py-6 text-center text-xs font-medium text-muted-foreground uppercase">
                    {t('No subcategories found')}
                </p>
            )}
        </Card>
    );
}

function ActionsMenu({
    label,
    onEdit,
    onAddChild,
    onDelete,
}: {
    label: string;
    onEdit: () => void;
    onAddChild?: () => void;
    onDelete: () => void;
}) {
    const { t } = useTranslation();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label={label}
                >
                    <EllipsisVertical />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onEdit}>
                    <Pencil />
                    {t('Edit')}
                </DropdownMenuItem>
                {onAddChild && (
                    <DropdownMenuItem onSelect={onAddChild}>
                        <Plus />
                        {t('Add subcategory')}
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                    <Trash2 />
                    {t('Delete')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function CategoryFormDialog({
    category,
    parent = null,
    onClose,
}: {
    category?: Subcategory;
    parent?: Category | null;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const form = useForm({
        name: category?.name ?? '',
        icon: category?.icon ?? parent?.icon ?? 'book-open',
        ...(category ? {} : { parent_id: parent?.id ?? null }),
    });

    const title = category
        ? t('Edit category')
        : parent
          ? t('Add subcategory to :name', { name: parent.name })
          : t('Add category');

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };

        if (category) {
            form.put(update.url(category.id), options);
        } else {
            form.post(store.url(), options);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <form onSubmit={submit} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>
                            {t(
                                'Categories group courses, exams, store products and blog posts.',
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="category-name">{t('Name')}</Label>
                        <Input
                            id="category-name"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            maxLength={60}
                            required
                            autoFocus
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    <fieldset className="space-y-2">
                        <legend className="text-sm font-medium">
                            {t('Icon')}
                        </legend>
                        <div
                            role="radiogroup"
                            aria-label={t('Icon')}
                            className="grid grid-cols-8 gap-1.5"
                        >
                            {Object.entries(categoryIcons).map(
                                ([key, Icon]) => {
                                    const selected = form.data.icon === key;

                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            aria-label={key}
                                            title={key}
                                            onClick={() =>
                                                form.setData('icon', key)
                                            }
                                            className={cn(
                                                'flex aspect-square items-center justify-center rounded-md border hover:bg-accent',
                                                selected &&
                                                    'border-primary bg-primary/10 text-primary ring-1 ring-primary',
                                            )}
                                        >
                                            <Icon
                                                className="size-4"
                                                aria-hidden
                                            />
                                        </button>
                                    );
                                },
                            )}
                        </div>
                        <InputError message={form.errors.icon} />
                    </fieldset>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                {t('Cancel')}
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            {category ? t('Save changes') : t('Add')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteCategoryDialog({
    category,
    isParent,
    defaultName,
    onClose,
}: {
    category: Subcategory;
    isParent: boolean;
    defaultName: string;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const [processing, setProcessing] = useState(false);

    const confirm = () =>
        router.delete(destroy.url(category.id), {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: onClose,
        });

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {t('Delete :name?', { name: category.name })}
                    </DialogTitle>
                    <DialogDescription>
                        {isParent
                            ? t(
                                  'Its subcategories are deleted too, and its courses, exams, products and posts move to :default.',
                                  { default: t(defaultName) },
                              )
                            : t(
                                  'Any content in this subcategory moves to :default.',
                                  { default: t(defaultName) },
                              )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{t('Cancel')}</Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={confirm}
                        disabled={processing}
                    >
                        {t('Delete')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function SortCategoriesDialog({
    categories,
    onClose,
}: {
    categories: Category[];
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const [order, setOrder] = useState(categories);
    const [processing, setProcessing] = useState(false);

    const move = (from: number, to: number) =>
        setOrder((current) => {
            const next = [...current];
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item);

            return next;
        });

    const save = () =>
        router.put(
            sort.url(),
            { ids: order.map((category) => category.id) },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
                onSuccess: onClose,
            },
        );

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('Sort categories')}</DialogTitle>
                    <DialogDescription>
                        {t(
                            'This order is used in the menus and catalog pages of the site.',
                        )}
                    </DialogDescription>
                </DialogHeader>
                <ol className="max-h-96 space-y-2 overflow-y-auto">
                    {order.map((category, i) => (
                        <li
                            key={category.id}
                            className="flex items-center gap-3 rounded-lg border px-3 py-2"
                        >
                            <span className="w-5 text-sm text-muted-foreground tabular-nums">
                                {i + 1}
                            </span>
                            <IconBadge icon={category.icon} size="sm" />
                            <span className="flex-1 text-sm font-medium">
                                {category.name}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t('Move :name up', {
                                    name: category.name,
                                })}
                                disabled={i === 0}
                                onClick={() => move(i, i - 1)}
                            >
                                <ArrowUp />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={t('Move :name down', {
                                    name: category.name,
                                })}
                                disabled={i === order.length - 1}
                                onClick={() => move(i, i + 1)}
                            >
                                <ArrowDown />
                            </Button>
                        </li>
                    ))}
                </ol>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">{t('Cancel')}</Button>
                    </DialogClose>
                    <Button onClick={save} disabled={processing}>
                        {t('Save order')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
