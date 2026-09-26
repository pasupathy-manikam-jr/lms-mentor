import { Head, router, useForm } from '@inertiajs/react';
import {
    EllipsisVertical,
    Pencil,
    Plus,
    Search,
    Send,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import type { Paginator } from '@/components/admin/data-table-pagination';
import { Field } from '@/components/admin/course-form';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import newsletterRoutes from '@/routes/admin/newsletters';

type Audience = 'subscribers' | 'students' | 'users';

type NewsletterRow = {
    id: number;
    subject: string;
    body: string;
    audience: Audience | null;
    recipients_count: number;
    sent_at: string | null;
    created_at: string;
};

type Filters = { search?: string; per_page?: number };

const AUDIENCE_LABEL: Record<Audience, string> = {
    subscribers: 'Newsletter subscribers',
    students: 'All students',
    users: 'All users',
};

/**
 * Newsletters, following the Mentor demo: the newsletter list, the Add Newsletter dialog, and sending
 * to subscribers, students or all users.
 */
export default function Newsletters({
    newsletters,
    filters,
    audiences,
    unsubscribedCount,
}: {
    newsletters: Paginator & { data: NewsletterRow[] };
    filters: Filters;
    audiences: Record<Audience, number>;
    unsubscribedCount: number;
}) {
    const { t, intlLocale } = useTranslation();
    const [search, setSearch] = useState(filters.search ?? '');
    const [editing, setEditing] = useState<NewsletterRow | 'new' | null>(null);
    const [sending, setSending] = useState<NewsletterRow | null>(null);
    const [deleting, setDeleting] = useState<NewsletterRow | null>(null);
    const dateTime = new Intl.DateTimeFormat(intlLocale, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

    const applyFilters = (changes: Partial<Filters>) =>
        router.get(
            newsletterRoutes.index.url(),
            Object.fromEntries(
                Object.entries({ ...filters, ...changes }).filter(
                    ([, value]) => value !== undefined && value !== '',
                ),
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );

    return (
        <>
            <Head title={t('Newsletters')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {t('Newsletters')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t(
                                ':count subscribers · :unsubscribed unsubscribed',
                                {
                                    count: String(audiences.subscribers),
                                    unsubscribed: String(unsubscribedCount),
                                },
                            )}
                        </p>
                    </div>
                    <Button onClick={() => setEditing('new')}>
                        <Plus />
                        {t('Add newsletter')}
                    </Button>
                </div>

                <Card className="gap-0 py-0">
                    <CardHeader className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                        <CardTitle className="text-lg">
                            {t('Newsletter list')}
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <form
                                role="search"
                                className="relative w-full md:w-64"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    applyFilters({ search });
                                }}
                            >
                                <Search
                                    className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                                    aria-hidden
                                />
                                <Input
                                    type="search"
                                    placeholder={t('Search')}
                                    aria-label={t('Search newsletters')}
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="ps-9"
                                />
                            </form>
                            <Select
                                value={String(filters.per_page ?? 10)}
                                onValueChange={(value) =>
                                    applyFilters({ per_page: Number(value) })
                                }
                            >
                                <SelectTrigger
                                    className="w-20"
                                    aria-label={t('Rows per page')}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 50].map((size) => (
                                        <SelectItem
                                            key={size}
                                            value={String(size)}
                                        >
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <table className="w-full border-t text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-6 py-3 text-start font-medium">
                                        {t('Subject')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        {t('Status')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        {t('Sent to')}
                                    </th>
                                    <th className="px-3 py-3 text-start font-medium">
                                        {t('Date')}
                                    </th>
                                    <th className="px-6 py-3 text-end font-medium">
                                        {t('Action')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {newsletters.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-10 text-center"
                                        >
                                            {t('No newsletters found')}
                                        </td>
                                    </tr>
                                )}
                                {newsletters.data.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="max-w-96 px-6 py-3 font-medium">
                                            {row.subject}
                                        </td>
                                        <td className="px-3 py-3">
                                            <Badge
                                                variant={
                                                    row.sent_at
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {row.sent_at
                                                    ? t('Sent')
                                                    : t('Draft')}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-3 text-muted-foreground">
                                            {row.audience
                                                ? t(':audience (:count)', {
                                                      audience: t(
                                                          AUDIENCE_LABEL[
                                                              row.audience
                                                          ],
                                                      ),
                                                      count: String(
                                                          row.recipients_count,
                                                      ),
                                                  })
                                                : '—'}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            {dateTime.format(
                                                new Date(
                                                    row.sent_at ??
                                                        row.created_at,
                                                ),
                                            )}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                {!row.sent_at && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            setSending(row)
                                                        }
                                                    >
                                                        <Send />
                                                        {t('Send')}
                                                    </Button>
                                                )}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="rounded-full"
                                                            aria-label={t(
                                                                'Actions for :name',
                                                                {
                                                                    name: row.subject,
                                                                },
                                                            )}
                                                        >
                                                            <EllipsisVertical />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {!row.sent_at && (
                                                            <DropdownMenuItem
                                                                onSelect={() =>
                                                                    setEditing(
                                                                        row,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil />
                                                                {t('Edit')}
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            onSelect={() =>
                                                                setDeleting(row)
                                                            }
                                                        >
                                                            <Trash2 />
                                                            {t('Delete')}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <DataTablePagination paginator={newsletters} />
                </Card>
            </div>

            {editing && (
                <NewsletterDialog
                    newsletter={editing === 'new' ? null : editing}
                    onClose={() => setEditing(null)}
                />
            )}
            {sending && (
                <SendDialog
                    newsletter={sending}
                    audiences={audiences}
                    onClose={() => setSending(null)}
                />
            )}
            {deleting && (
                <Dialog
                    open
                    onOpenChange={(open) => !open && setDeleting(null)}
                >
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {t('Delete this newsletter?')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('":name" will be deleted.', {
                                    name: deleting.subject,
                                })}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">{t('Cancel')}</Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                onClick={() =>
                                    router.delete(
                                        newsletterRoutes.destroy.url(
                                            deleting.id,
                                        ),
                                        {
                                            preserveScroll: true,
                                            onSuccess: () => setDeleting(null),
                                        },
                                    )
                                }
                            >
                                {t('Delete')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

Newsletters.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Newsletters', href: newsletterRoutes.index() },
    ],
};

function NewsletterDialog({
    newsletter,
    onClose,
}: {
    newsletter: NewsletterRow | null;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const form = useForm({
        subject: newsletter?.subject ?? '',
        body: newsletter?.body ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };

        if (newsletter) {
            form.put(newsletterRoutes.update.url(newsletter.id), options);
        } else {
            form.post(newsletterRoutes.store.url(), options);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <form onSubmit={submit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>
                            {newsletter
                                ? t('Edit newsletter')
                                : t('Add newsletter')}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            {t('Write the subject and the email.')}
                        </DialogDescription>
                    </DialogHeader>
                    <Field
                        label={t('Subject')}
                        htmlFor="subject"
                        required
                        error={form.errors.subject}
                    >
                        <Input
                            id="subject"
                            value={form.data.subject}
                            onChange={(event) =>
                                form.setData('subject', event.target.value)
                            }
                            aria-invalid={!!form.errors.subject}
                            className="h-10 rounded-lg"
                        />
                    </Field>
                    <Field
                        label={t('Description')}
                        htmlFor="body"
                        required
                        error={form.errors.body}
                    >
                        <RichTextEditor
                            id="body"
                            value={form.data.body}
                            onChange={(html) => form.setData('body', html)}
                            placeholder={t('Enter description')}
                            invalid={!!form.errors.body}
                        />
                    </Field>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                {t('Close')}
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner />}
                            {t('Submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function SendDialog({
    newsletter,
    audiences,
    onClose,
}: {
    newsletter: NewsletterRow;
    audiences: Record<Audience, number>;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const form = useForm({ audience: 'subscribers' as Audience });

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(newsletterRoutes.send.url(newsletter.id), {
                            preserveScroll: true,
                            onSuccess: onClose,
                        });
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>{t('Send newsletter')}</DialogTitle>
                        <DialogDescription>
                            {t(
                                '":name" is sent once. People who unsubscribed are left out.',
                                { name: newsletter.subject },
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <Field label={t('Send to')} htmlFor="audience" required>
                        <Select
                            value={form.data.audience}
                            onValueChange={(value) =>
                                form.setData('audience', value as Audience)
                            }
                        >
                            <SelectTrigger
                                id="audience"
                                className="h-10 w-full rounded-lg"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(
                                    Object.keys(AUDIENCE_LABEL) as Audience[]
                                ).map((audience) => (
                                    <SelectItem key={audience} value={audience}>
                                        {t(':audience (:count)', {
                                            audience: t(
                                                AUDIENCE_LABEL[audience],
                                            ),
                                            count: String(audiences[audience]),
                                        })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError
                            message={form.errors.audience}
                            className="mt-2"
                        />
                    </Field>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                {t('Cancel')}
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={
                                form.processing ||
                                audiences[form.data.audience] === 0
                            }
                        >
                            {form.processing ? <Spinner /> : <Send />}
                            {t('Send to :count people', {
                                count: String(audiences[form.data.audience]),
                            })}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
