import { router, useForm } from '@inertiajs/react';
import { Bot, EllipsisVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
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
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import info from '@/routes/admin/courses/info';

type InfoType = 'faq' | 'requirement' | 'outcome';

export type InfoItem = {
    id: number;
    type: string;
    /** The question for FAQs; the text itself for requirements and outcomes. */
    title: string;
    body: string | null;
};

export type CourseInfoLists = Partial<Record<InfoType, InfoItem[]>>;

/** One sub-tab's wording. `body` names the second field when the list has one (FAQ answers, spec values). */
export type InfoListConfig = {
    tab: string;
    add: string;
    create: string;
    update: string;
    field: string;
    body?: string;
};

/** Where an Info tab saves: the store URL and a URL per item. */
export type InfoUrls = {
    store: string;
    update: (id: number) => string;
    destroy: (id: number) => string;
};

/** Labels per list, in the demo's wording. */
const LISTS: Record<InfoType, InfoListConfig> = {
    faq: {
        tab: 'Course FAQs',
        add: 'Add FAQ',
        create: 'Create FAQ',
        update: 'Update FAQ',
        field: 'Question',
        body: 'Answer',
    },
    requirement: {
        tab: 'Requirements',
        add: 'Add requirement',
        create: 'Create requirement',
        update: 'Update requirement',
        field: 'Requirement',
    },
    outcome: {
        tab: 'Outcomes',
        add: 'Add outcome',
        create: 'Create outcome',
        update: 'Update outcome',
        field: 'Outcome',
    },
};

const visit = { preserveScroll: true, preserveState: true };

/**
 * The editor's Info tab, following the demo: Course FAQs, Requirements and Outcomes sub-tabs, each a
 * list of cards with Edit / AI Agent / Remove, and a create dialog.
 */
export function CourseInfo({
    courseId,
    lists,
}: {
    courseId: number;
    lists: CourseInfoLists;
}) {
    return (
        <InfoLists
            config={LISTS}
            lists={lists}
            urls={{
                store: info.store.url(courseId),
                update: (id) =>
                    info.update.url({ course: courseId, infoItem: id }),
                destroy: (id) =>
                    info.destroy.url({ course: courseId, infoItem: id }),
            }}
        />
    );
}

/**
 * Sub-tabs of short lists (FAQs, requirements, specifications…), each item a card with Edit / AI Agent /
 * Remove, and a create dialog. Shared by the course and product editors.
 */
export function InfoLists({
    config,
    lists,
    urls,
}: {
    config: Record<string, InfoListConfig>;
    lists: Partial<Record<string, InfoItem[]>>;
    urls: InfoUrls;
}) {
    const { t } = useTranslation();
    const [type, setType] = useState<string>(Object.keys(config)[0]);
    const [editing, setEditing] = useState<InfoItem | 'new' | null>(null);
    const [removing, setRemoving] = useState<InfoItem | null>(null);
    const labels = config[type];
    const items = lists[type] ?? [];

    return (
        <Card className="gap-6 p-4 sm:p-6">
            <div
                role="tablist"
                className="grid h-10 auto-cols-fr grid-flow-col gap-1 rounded-lg bg-muted p-1 text-muted-foreground"
            >
                {Object.keys(config).map((value) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={type === value}
                        onClick={() => setType(value)}
                        className={cn(
                            'truncate rounded-md px-3 text-sm font-medium transition-all',
                            type === value
                                ? 'bg-background text-foreground shadow'
                                : 'hover:text-foreground',
                        )}
                    >
                        {t(config[value].tab)}
                    </button>
                ))}
            </div>

            <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-medium">{t(labels.tab)}</h2>
                <Button onClick={() => setEditing('new')}>
                    <Plus />
                    {t(labels.add)}
                </Button>
            </div>

            {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                    {t('Nothing added yet.')}
                </p>
            ) : (
                <ul className="space-y-4">
                    {items.map((item) => (
                        <li
                            key={item.id}
                            className="flex items-center justify-between gap-4 rounded-lg border p-4"
                        >
                            <div className="min-w-0 space-y-1 text-sm">
                                <p className="font-medium">{item.title}</p>
                                {item.body && (
                                    <p className="whitespace-pre-line text-muted-foreground">
                                        {item.body}
                                    </p>
                                )}
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 rounded-full"
                                        aria-label={t('Actions for :name', {
                                            name: item.title,
                                        })}
                                    >
                                        <EllipsisVertical />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onSelect={() => setEditing(item)}
                                    >
                                        <Pencil />
                                        {t('Edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        disabled
                                        className="text-violet-700 dark:text-violet-400"
                                    >
                                        <Bot className="text-inherit" />
                                        {t('AI Agent')}
                                        <span className="ms-auto text-xs">
                                            {t('Soon')}
                                        </span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={() => setRemoving(item)}
                                    >
                                        <Trash2 />
                                        {t('Remove')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </li>
                    ))}
                </ul>
            )}

            {editing && (
                <InfoItemDialog
                    urls={urls}
                    labels={labels}
                    type={type}
                    item={editing === 'new' ? undefined : editing}
                    onClose={() => setEditing(null)}
                />
            )}

            {removing && (
                <Dialog
                    open
                    onOpenChange={(open) => !open && setRemoving(null)}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t('Remove this item?')}</DialogTitle>
                            <DialogDescription>
                                {removing.title}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">{t('Cancel')}</Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                onClick={() =>
                                    router.delete(urls.destroy(removing.id), {
                                        ...visit,
                                        onSuccess: () => setRemoving(null),
                                    })
                                }
                            >
                                {t('Remove')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </Card>
    );
}

function InfoItemDialog({
    urls,
    labels,
    type,
    item,
    onClose,
}: {
    urls: InfoUrls;
    labels: InfoListConfig;
    type: string;
    item?: InfoItem;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const hasBody = !!labels.body;
    const form = useForm({
        type,
        title: item?.title ?? '',
        body: item?.body ?? '',
    });
    const { data, setData, errors } = form;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((values) => ({
            ...values,
            body: hasBody ? values.body : null,
        }));
        const options = { ...visit, onSuccess: onClose };

        if (item) {
            form.put(urls.update(item.id), options);
        } else {
            form.post(urls.store, options);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="mb-2">
                    <DialogTitle>
                        {t(item ? labels.update : labels.create)}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="info-title">{t(labels.field)}</Label>
                        <Input
                            id="info-title"
                            required
                            value={data.title}
                            onChange={(event) =>
                                setData('title', event.target.value)
                            }
                            placeholder={t(labels.field)}
                            aria-invalid={!!errors.title}
                            autoFocus
                        />
                        <InputError message={errors.title} />
                    </div>
                    {hasBody && (
                        <div className="space-y-2">
                            <Label htmlFor="info-body">
                                {t(labels.body ?? '')}
                            </Label>
                            <Textarea
                                id="info-body"
                                required
                                value={data.body}
                                onChange={(event) =>
                                    setData('body', event.target.value)
                                }
                                placeholder={t(labels.body ?? '')}
                                aria-invalid={!!errors.body}
                                className="min-h-28"
                            />
                            <InputError message={errors.body} />
                        </div>
                    )}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner />}
                            {t('Save')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
