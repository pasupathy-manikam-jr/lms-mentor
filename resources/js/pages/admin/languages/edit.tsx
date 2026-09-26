import { Head, router, setLayoutProps } from '@inertiajs/react';
import { Save, Search } from 'lucide-react';
import { useState } from 'react';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import type { Paginator } from '@/components/admin/data-table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import languageRoutes from '@/routes/admin/languages';

type Line = { key: string; value: string; is_changed: boolean };

type Filters = { search?: string; missing?: boolean | string };

/**
 * The translation editor for one language: the English text beside this language's wording, 25 lines
 * a page. Saving keeps only lines that differ from the shipped translation.
 */
export default function EditLanguage({
    language,
    lines,
    filters,
    progress,
}: {
    language: { id: number; code: string; name: string; flag: string | null };
    lines: Paginator & { data: Line[] };
    filters: Filters;
    progress: { total: number; translated: number };
}) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search ?? '');
    const [edits, setEdits] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const missingOnly = filters.missing === true || filters.missing === '1';
    const changedCount = Object.keys(edits).length;
    const isEnglish = language.code === 'en';

    setLayoutProps({
        breadcrumbs: [
            { title: 'Dashboard', href: dashboard() },
            { title: 'Languages', href: languageRoutes.index() },
            { title: language.name, href: languageRoutes.edit(language.code) },
        ],
    });

    const applyFilters = (changes: Partial<Filters>) =>
        router.get(
            languageRoutes.edit.url(language.code),
            Object.fromEntries(
                Object.entries({
                    search: filters.search,
                    missing: missingOnly ? 1 : undefined,
                    ...changes,
                }).filter(
                    ([, value]) =>
                        value !== undefined && value !== '' && value !== false,
                ),
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );

    const save = () =>
        router.put(
            languageRoutes.lines.url(language.code),
            {
                lines: Object.entries(edits).map(([key, value]) => ({
                    key,
                    value,
                })),
            },
            {
                preserveScroll: true,
                onStart: () => setSaving(true),
                onFinish: () => setSaving(false),
                onSuccess: () => setEdits({}),
            },
        );

    return (
        <>
            <Head title={`${t('Translation')} · ${language.name}`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {language.flag} {language.name}
                        </h1>
                        {!isEnglish && (
                            <p className="text-sm text-muted-foreground">
                                {t(':translated of :total lines translated', {
                                    translated: String(progress.translated),
                                    total: String(progress.total),
                                })}
                            </p>
                        )}
                    </div>
                    <Button
                        onClick={save}
                        disabled={saving || changedCount === 0}
                    >
                        {saving ? <Spinner /> : <Save />}
                        {changedCount > 0
                            ? t('Save :count changes', {
                                  count: String(changedCount),
                              })
                            : t('Save changes')}
                    </Button>
                </div>

                <Card className="gap-0 py-0">
                    <CardHeader className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                        <form
                            role="search"
                            className="relative w-full md:w-80"
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
                                placeholder={t('Search text')}
                                aria-label={t('Search text')}
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="ps-9"
                            />
                        </form>
                        {!isEnglish && (
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="missing"
                                    checked={missingOnly}
                                    onCheckedChange={(checked) =>
                                        applyFilters({
                                            missing: checked === true,
                                        })
                                    }
                                />
                                <Label htmlFor="missing">
                                    {t('Untranslated only')}
                                </Label>
                            </div>
                        )}
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <table className="w-full border-t text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="w-1/2 px-6 py-3 text-start font-medium">
                                        {t('English')}
                                    </th>
                                    <th className="px-6 py-3 text-start font-medium">
                                        {isEnglish
                                            ? t('Shown as')
                                            : language.name}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {lines.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={2}
                                            className="px-6 py-10 text-center"
                                        >
                                            {t('No results found')}
                                        </td>
                                    </tr>
                                )}
                                {lines.data.map((line) => {
                                    const value = edits[line.key] ?? line.value;

                                    return (
                                        <tr
                                            key={line.key}
                                            className="border-b align-top last:border-b-0"
                                        >
                                            <td className="px-6 py-3 text-muted-foreground">
                                                {line.key}
                                                {line.is_changed && (
                                                    <Badge
                                                        variant="outline"
                                                        className="ms-2"
                                                    >
                                                        {t('Changed here')}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                <Textarea
                                                    rows={
                                                        line.key.length > 80
                                                            ? 3
                                                            : 1
                                                    }
                                                    value={value}
                                                    placeholder={
                                                        isEnglish
                                                            ? line.key
                                                            : t(
                                                                  'Not translated',
                                                              )
                                                    }
                                                    aria-label={line.key}
                                                    onChange={(event) =>
                                                        setEdits({
                                                            ...edits,
                                                            [line.key]:
                                                                event.target
                                                                    .value,
                                                        })
                                                    }
                                                    className="min-h-9 resize-y"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <DataTablePagination paginator={lines} />
                </Card>
            </div>
        </>
    );
}
