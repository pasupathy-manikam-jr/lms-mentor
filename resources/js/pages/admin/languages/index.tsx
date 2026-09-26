import { Head, Link, router, useForm } from '@inertiajs/react';
import { Info, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Field } from '@/components/admin/course-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import languageRoutes from '@/routes/admin/languages';

type LanguageRow = {
    id: number;
    code: string;
    name: string;
    flag: string | null;
    is_active: boolean;
    is_default: boolean;
    overrides_count: number;
};

/**
 * Translation → Language Settings, following the Mentor demo: each language with its default marker,
 * edit link and on/off switch, plus Add Language.
 */
export default function Languages({ languages }: { languages: LanguageRow[] }) {
    const { t } = useTranslation();
    const [adding, setAdding] = useState(false);

    return (
        <>
            <Head title={t('Language settings')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t('Language settings')}
                    </h1>
                    <Button onClick={() => setAdding(true)}>
                        <Plus />
                        {t('Add language')}
                    </Button>
                </div>

                <Card className="mx-auto w-full max-w-4xl gap-4 p-4 sm:p-6">
                    <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
                        <Info className="mt-0.5 size-4 shrink-0" />
                        <ul className="list-disc space-y-1 ps-4">
                            <li>
                                {t(
                                    'Translations apply to the whole site: public pages, dashboards and emails.',
                                )}
                            </li>
                            <li>
                                {t(
                                    'Text an admin writes (courses, blog posts, page wording) is shown as written in every language.',
                                )}
                            </li>
                        </ul>
                    </div>

                    {languages.map((language) => (
                        <div
                            key={language.id}
                            className="flex flex-wrap items-center gap-3 rounded-xl border px-5 py-4"
                        >
                            <span className="text-2xl" aria-hidden>
                                {language.flag}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-lg">
                                    {language.name}{' '}
                                    <span className="text-sm text-muted-foreground">
                                        ({language.code})
                                    </span>
                                </p>
                                {language.overrides_count > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        {t(':count lines changed here', {
                                            count: String(
                                                language.overrides_count,
                                            ),
                                        })}
                                    </p>
                                )}
                            </div>
                            {language.is_default ? (
                                <Badge variant="secondary">
                                    {t('Default')}
                                </Badge>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        router.post(
                                            languageRoutes.default.url(
                                                language.id,
                                            ),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    {t('Set default')}
                                </Button>
                            )}
                            <Button
                                size="icon"
                                variant="ghost"
                                asChild
                                aria-label={t('Edit :name', {
                                    name: language.name,
                                })}
                            >
                                <Link href={languageRoutes.edit(language.code)}>
                                    <Pencil />
                                </Link>
                            </Button>
                            {!language.is_default && language.code !== 'en' && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    aria-label={t('Delete :name', {
                                        name: language.name,
                                    })}
                                    onClick={() =>
                                        confirm(
                                            t(
                                                'Delete :name and its changed lines?',
                                                { name: language.name },
                                            ),
                                        ) &&
                                        router.delete(
                                            languageRoutes.destroy.url(
                                                language.id,
                                            ),
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    <Trash2 />
                                </Button>
                            )}
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id={`active-${language.id}`}
                                    checked={language.is_active}
                                    disabled={language.is_default}
                                    onCheckedChange={(checked) =>
                                        router.patch(
                                            languageRoutes.update.url(
                                                language.id,
                                            ),
                                            { is_active: checked === true },
                                            { preserveScroll: true },
                                        )
                                    }
                                />
                                <Label htmlFor={`active-${language.id}`}>
                                    {t('On')}
                                </Label>
                            </div>
                        </div>
                    ))}
                </Card>
            </div>

            {adding && <AddLanguageDialog onClose={() => setAdding(false)} />}
        </>
    );
}

Languages.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Languages', href: languageRoutes.index() },
    ],
};

function AddLanguageDialog({ onClose }: { onClose: () => void }) {
    const { t } = useTranslation();
    const form = useForm({ code: '', name: '', flag: '' });

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(languageRoutes.store.url(), {
                            preserveScroll: true,
                            onSuccess: onClose,
                        });
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>{t('Add language')}</DialogTitle>
                        <DialogDescription>
                            {t(
                                'A new language starts switched off, with English text until you translate it.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <Field
                        label={t('Language code')}
                        htmlFor="code"
                        required
                        error={form.errors.code}
                    >
                        <Input
                            id="code"
                            value={form.data.code}
                            onChange={(event) =>
                                form.setData('code', event.target.value)
                            }
                            placeholder="ta"
                            className="h-10 rounded-lg"
                        />
                    </Field>
                    <Field
                        label={t('Name')}
                        htmlFor="name"
                        required
                        error={form.errors.name}
                    >
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            placeholder="தமிழ்"
                            className="h-10 rounded-lg"
                        />
                    </Field>
                    <Field
                        label={t('Flag')}
                        htmlFor="flag"
                        error={form.errors.flag}
                    >
                        <Input
                            id="flag"
                            value={form.data.flag}
                            onChange={(event) =>
                                form.setData('flag', event.target.value)
                            }
                            placeholder="🇮🇳"
                            className="h-10 rounded-lg"
                        />
                    </Field>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                {t('Cancel')}
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner />}
                            {t('Add language')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
