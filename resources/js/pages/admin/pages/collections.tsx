import { Head, useForm } from '@inertiajs/react';
import { Info, Save } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/hooks/use-translation';
import { dashboard } from '@/routes';
import { index, update } from '@/routes/admin/collections';

type Item = { id: number; title: string; hint?: string; image: string | null };
type Key = 'courses' | 'instructors' | 'posts';

/**
 * Frontend → Home collections (the demo's Page API): pick the courses, instructors and blog posts the
 * home page shows.
 */
export default function HomeCollections({
    courses,
    instructors,
    posts,
    picked,
}: {
    courses: { id: number; title: string; image_url: string | null }[];
    instructors: {
        id: number;
        name: string;
        title: string;
        avatar_url: string | null;
    }[];
    posts: { id: number; title: string; image_url: string | null }[];
    picked: Record<Key, number[]>;
}) {
    const { t } = useTranslation();
    const form = useForm(picked);

    const collections: {
        key: Key;
        title: string;
        description: string;
        max: number;
        /** Whether the home page follows the picked order. */
        ordered: boolean;
        items: Item[];
    }[] = [
        {
            key: 'courses',
            title: 'Popular courses',
            description:
                'Shown in the home page’s “Most-loved courses” section. Pick at least one: with none, that section is empty.',
            max: 8,
            ordered: false,
            items: courses.map((c) => ({
                id: c.id,
                title: c.title,
                image: c.image_url,
            })),
        },
        {
            key: 'instructors',
            title: 'Instructors',
            description:
                'Shown in the home page’s instructors section, in the order you pick them. None picked shows every instructor.',
            max: 12,
            ordered: true,
            items: instructors.map((i) => ({
                id: i.id,
                title: i.name,
                hint: i.title,
                image: i.avatar_url,
            })),
        },
        {
            key: 'posts',
            title: 'Blog posts',
            description:
                'Shown in the home page’s blog section, in the order you pick them. None picked shows the latest six posts.',
            max: 6,
            ordered: true,
            items: posts.map((p) => ({
                id: p.id,
                title: p.title,
                image: p.image_url,
            })),
        },
    ];

    const toggle = (key: Key, id: number, checked: boolean) =>
        form.setData(
            key,
            checked
                ? [...form.data[key], id]
                : form.data[key].filter((value) => value !== id),
        );

    return (
        <>
            <Head title={t('Home collections')} />
            <form
                className="flex flex-1 flex-col gap-6 p-4 md:p-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.put(update.url(), { preserveScroll: true });
                }}
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t('Home collections')}
                    </h1>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? <Spinner /> : <Save />}
                        {t('Save changes')}
                    </Button>
                </div>

                <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
                    <Info className="mt-0.5 size-4 shrink-0" />
                    <p>
                        {t(
                            'These lists decide what the home page shows. Changes appear on the site as soon as you save.',
                        )}
                    </p>
                </div>

                {collections.map((collection) => (
                    <CollectionCard
                        key={collection.key}
                        title={t(collection.title)}
                        description={t(collection.description)}
                        max={collection.max}
                        ordered={collection.ordered}
                        items={collection.items}
                        selected={form.data[collection.key]}
                        onToggle={(id, checked) =>
                            toggle(collection.key, id, checked)
                        }
                        error={
                            form.errors[collection.key] ??
                            Object.entries(form.errors).find(([field]) =>
                                field.startsWith(`${collection.key}.`),
                            )?.[1]
                        }
                    />
                ))}
            </form>
        </>
    );
}

HomeCollections.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Home collections', href: index() },
    ],
};

function CollectionCard({
    title,
    description,
    max,
    ordered,
    items,
    selected,
    onToggle,
    error,
}: {
    title: string;
    description: string;
    max: number;
    ordered: boolean;
    items: Item[];
    selected: number[];
    onToggle: (id: number, checked: boolean) => void;
    error?: string;
}) {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const shown = items.filter((item) =>
        item.title.toLowerCase().includes(search.trim().toLowerCase()),
    );

    return (
        <Card className="gap-4 p-4 sm:p-6">
            <CardHeader className="flex flex-col gap-3 p-0 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        {title}
                        <Badge variant="secondary" className="tabular-nums">
                            {t(':count of :max', {
                                count: String(selected.length),
                                max: String(max),
                            })}
                        </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                        {description}
                    </CardDescription>
                </div>
                <Input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t('Search')}
                    aria-label={t('Search :name', { name: title })}
                    className="sm:w-56"
                />
            </CardHeader>
            <ul className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
                {shown.map((item) => {
                    const position = selected.indexOf(item.id);
                    const isChecked = position !== -1;
                    const id = `${title}-${item.id}`;

                    return (
                        <li key={item.id}>
                            <label
                                htmlFor={id}
                                className="flex cursor-pointer items-center gap-3 rounded-lg border p-2 has-[:checked]:border-primary has-[:checked]:bg-muted has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
                            >
                                <Checkbox
                                    id={id}
                                    checked={isChecked}
                                    disabled={
                                        !isChecked && selected.length >= max
                                    }
                                    onCheckedChange={(checked) =>
                                        onToggle(item.id, checked === true)
                                    }
                                />
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt=""
                                        className="size-10 shrink-0 rounded object-cover"
                                    />
                                ) : (
                                    <span className="size-10 shrink-0 rounded bg-muted" />
                                )}
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium">
                                        {item.title}
                                    </span>
                                    {item.hint && (
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {item.hint}
                                        </span>
                                    )}
                                </span>
                                {ordered && isChecked && (
                                    <Badge className="tabular-nums">
                                        {position + 1}
                                    </Badge>
                                )}
                            </label>
                        </li>
                    );
                })}
            </ul>
            <InputError message={error} />
        </Card>
    );
}
