import { Head, router } from '@inertiajs/react';
import {
    Archive,
    Copy,
    FileText,
    Film,
    Folder,
    FolderPlus,
    LayoutGrid,
    Search,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { DataTablePagination } from '@/components/admin/data-table-pagination';
import type { Paginator } from '@/components/admin/data-table-pagination';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import mediaRoutes from '@/routes/admin/media';

type Kind = 'video' | 'image' | 'document' | 'compressed';

type MediaItem = {
    id: number;
    name: string;
    kind: Kind;
    mime_type: string;
    size: number;
    url: string;
};

type Filters = {
    search?: string;
    kind?: Kind;
    folder?: number | string;
    per_page?: number;
};

const TABS: { kind?: Kind; label: string }[] = [
    { label: 'All' },
    { kind: 'video', label: 'Videos' },
    { kind: 'image', label: 'Images' },
    { kind: 'document', label: 'Documents' },
    { kind: 'compressed', label: 'Compressed' },
];

const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * Media Library, following the Mentor demo: folders, type tabs with counts, a grid of files with Copy
 * link, upload, and deleting selected files.
 */
export default function MediaLibrary({
    media,
    counts,
    folders,
    filters,
    accept,
    canManageFolders,
}: {
    /** Folders are managed by admins; instructors can file uploads into them. */
    canManageFolders: boolean;
    media: Paginator & { data: MediaItem[] };
    counts: Partial<Record<Kind | 'all', number>>;
    folders: { id: number; name: string; media_count: number }[];
    filters: Filters;
    accept: string;
}) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search ?? '');
    const [selected, setSelected] = useState<number[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string>();
    const [addingFolder, setAddingFolder] = useState(false);
    const [copied, setCopied] = useState<number | null>(null);
    const input = useRef<HTMLInputElement>(null);
    const folderId = filters.folder ? Number(filters.folder) : undefined;

    const applyFilters = (changes: Partial<Filters>) => {
        setSelected([]);
        router.get(
            mediaRoutes.index.url(),
            Object.fromEntries(
                Object.entries({ ...filters, ...changes }).filter(
                    ([, value]) => value !== undefined && value !== '',
                ),
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const upload = (files: FileList | null) => {
        if (!files?.length) {
            return;
        }

        router.post(
            mediaRoutes.store.url(),
            { files: Array.from(files), folder_id: folderId ?? '' },
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => {
                    setUploading(true);
                    setUploadError(undefined);
                },
                onError: (errors) =>
                    setUploadError(Object.values(errors)[0] as string),
                onFinish: () => {
                    setUploading(false);

                    if (input.current) {
                        input.current.value = '';
                    }
                },
            },
        );
    };

    const copyLink = async (item: MediaItem) => {
        await navigator.clipboard.writeText(
            new URL(item.url, window.location.origin).toString(),
        );
        setCopied(item.id);
        setTimeout(() => setCopied(null), 1500);
    };

    return (
        <>
            <Head title={t('Media library')} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t('Media library')}
                    </h1>
                    <Button
                        onClick={() => input.current?.click()}
                        disabled={uploading}
                    >
                        <Upload />
                        {uploading ? t('Uploading…') : t('Upload')}
                    </Button>
                    <input
                        ref={input}
                        type="file"
                        multiple
                        accept={accept}
                        className="hidden"
                        onChange={(event) => upload(event.target.files)}
                    />
                </div>
                <InputError message={uploadError} />

                <Card className="gap-0 py-0">
                    <CardHeader className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                        <CardTitle className="text-lg">
                            {t('Media library')}
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
                                    aria-label={t('Search files')}
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="ps-9"
                                />
                            </form>
                            <Select
                                value={String(filters.per_page ?? 20)}
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
                                    {[20, 40, 80].map((size) => (
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

                    <div className="space-y-5 border-t px-6 py-5">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                {t('Folders')}
                            </p>
                            {canManageFolders && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="size-8"
                                    aria-label={t('New folder')}
                                    onClick={() => setAddingFolder(true)}
                                >
                                    <FolderPlus />
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <FolderButton
                                active={!folderId}
                                icon={LayoutGrid}
                                label={t('All items')}
                                onClick={() =>
                                    applyFilters({ folder: undefined })
                                }
                            />
                            {folders.map((folder) => (
                                <FolderButton
                                    key={folder.id}
                                    active={folderId === folder.id}
                                    icon={Folder}
                                    label={`${folder.name} (${folder.media_count})`}
                                    onClick={() =>
                                        applyFilters({ folder: folder.id })
                                    }
                                    onDelete={
                                        !canManageFolders
                                            ? undefined
                                            : () =>
                                                  confirm(
                                                      t(
                                                          'Delete the folder ":name"? Its files stay in All items.',
                                                          { name: folder.name },
                                                      ),
                                                  ) &&
                                                  router.delete(
                                                      mediaRoutes.folders.destroy.url(
                                                          folder.id,
                                                      ),
                                                      { preserveScroll: true },
                                                  )
                                    }
                                />
                            ))}
                        </div>

                        <div
                            role="tablist"
                            className="flex flex-wrap gap-2 border-b pb-3"
                        >
                            {TABS.map((tab) => {
                                const isActive = filters.kind === tab.kind;

                                return (
                                    <button
                                        key={tab.label}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        onClick={() =>
                                            applyFilters({ kind: tab.kind })
                                        }
                                        className={cn(
                                            'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium',
                                            isActive
                                                ? 'bg-primary text-primary-foreground'
                                                : 'hover:bg-muted',
                                        )}
                                    >
                                        {t(tab.label)}
                                        <span
                                            className={cn(
                                                'rounded px-1.5 text-xs tabular-nums',
                                                isActive
                                                    ? 'bg-primary-foreground/20'
                                                    : 'bg-muted',
                                            )}
                                        >
                                            {counts[tab.kind ?? 'all'] ?? 0}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {selected.length > 0 && (
                            <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-2 text-sm">
                                <span>
                                    {t(':count selected', {
                                        count: String(selected.length),
                                    })}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setSelected([])}
                                    >
                                        {t('Clear')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() =>
                                            confirm(
                                                t(
                                                    'Delete :count files? Pages that use them will show broken links.',
                                                    {
                                                        count: String(
                                                            selected.length,
                                                        ),
                                                    },
                                                ),
                                            ) &&
                                            router.delete(
                                                mediaRoutes.destroy.url(),
                                                {
                                                    data: { ids: selected },
                                                    preserveScroll: true,
                                                    onSuccess: () =>
                                                        setSelected([]),
                                                },
                                            )
                                        }
                                    >
                                        <Trash2 />
                                        {t('Delete')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {media.data.length === 0 ? (
                            <p className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
                                {t(
                                    'No files yet. Upload images, videos or documents to use them across the site.',
                                )}
                            </p>
                        ) : (
                            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {media.data.map((item) => {
                                    const isSelected = selected.includes(
                                        item.id,
                                    );

                                    return (
                                        <li
                                            key={item.id}
                                            className={cn(
                                                'relative overflow-hidden rounded-xl border',
                                                isSelected &&
                                                    'ring-2 ring-primary',
                                            )}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                aria-label={t('Select :name', {
                                                    name: item.name,
                                                })}
                                                onCheckedChange={(checked) =>
                                                    setSelected(
                                                        checked === true
                                                            ? [
                                                                  ...selected,
                                                                  item.id,
                                                              ]
                                                            : selected.filter(
                                                                  (id) =>
                                                                      id !==
                                                                      item.id,
                                                              ),
                                                    )
                                                }
                                                className="absolute start-2 top-2 z-10 bg-background"
                                            />
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex aspect-[4/3] items-center justify-center bg-muted"
                                            >
                                                <Preview item={item} />
                                            </a>
                                            <div className="flex items-center justify-between gap-2 p-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatSize(item.size)}
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="shrink-0"
                                                    onClick={() =>
                                                        copyLink(item)
                                                    }
                                                >
                                                    <Copy />
                                                    {copied === item.id
                                                        ? t('Copied')
                                                        : t('Copy link')}
                                                </Button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    <DataTablePagination paginator={media} />
                </Card>
            </div>

            {addingFolder && (
                <NewFolderDialog onClose={() => setAddingFolder(false)} />
            )}
        </>
    );
}

MediaLibrary.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Media library', href: mediaRoutes.index() },
    ],
};

function Preview({ item }: { item: MediaItem }) {
    if (item.kind === 'image') {
        return (
            <img
                src={item.url}
                alt=""
                loading="lazy"
                className="size-full object-cover"
            />
        );
    }

    const Icon =
        item.kind === 'video'
            ? Film
            : item.kind === 'compressed'
              ? Archive
              : FileText;

    return <Icon className="size-10 text-muted-foreground" aria-hidden />;
}

function FolderButton({
    active,
    icon: Icon,
    label,
    onClick,
    onDelete,
}: {
    active: boolean;
    icon: typeof Folder;
    label: string;
    onClick: () => void;
    onDelete?: () => void;
}) {
    const { t } = useTranslation();

    return (
        <div
            className={cn(
                'flex min-w-44 items-center rounded-lg border',
                active && 'border-primary bg-muted',
            )}
        >
            <button
                type="button"
                onClick={onClick}
                aria-pressed={active}
                className="flex flex-1 items-center gap-2 px-4 py-2.5 text-sm font-medium"
            >
                <Icon className="size-4 text-muted-foreground" />
                {label}
            </button>
            {onDelete && (
                <button
                    type="button"
                    onClick={onDelete}
                    aria-label={t('Delete folder')}
                    className="px-2 text-muted-foreground hover:text-destructive"
                >
                    <X className="size-4" />
                </button>
            )}
        </div>
    );
}

function NewFolderDialog({ onClose }: { onClose: () => void }) {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [error, setError] = useState<string>();

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-sm">
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.post(
                            mediaRoutes.folders.store.url(),
                            { name },
                            {
                                preserveScroll: true,
                                onSuccess: onClose,
                                onError: (errors) => setError(errors.name),
                            },
                        );
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>{t('New folder')}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {t('Name the folder.')}
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder={t('Folder name')}
                        aria-label={t('Folder name')}
                        autoFocus
                    />
                    <InputError message={error} />
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                {t('Cancel')}
                            </Button>
                        </DialogClose>
                        <Button type="submit">{t('Create')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
