import { router } from '@inertiajs/react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import assets from '@/routes/admin/products/assets';
import { download } from '@/routes/store/files';

export type GalleryImage = { id: number; name: string; url: string };
export type ProductFile = { id: number; name: string; size: number };

const formatSize = (bytes: number) =>
    bytes < 1024
        ? `${bytes} B`
        : bytes < 1024 * 1024
          ? `${(bytes / 1024).toFixed(1)} KB`
          : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * The demo's Gallery Images and Downloadable Files sections of the Media & Files tab. Uploads save as
 * soon as they are chosen.
 */
export function ProductAssets({
    productId,
    productSlug,
    gallery,
    files,
}: {
    productId: number;
    productSlug: string;
    gallery: GalleryImage[];
    files: ProductFile[];
}) {
    const { t } = useTranslation();

    return (
        <>
            <AssetSection
                productId={productId}
                kind="image"
                title={t('Gallery images')}
                hint={t('Shown on the public product page. Up to 8 images.')}
                empty={t('No gallery images uploaded yet')}
                accept="image/*"
                count={gallery.length}
                limit={8}
            >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {gallery.map((image) => (
                        <div key={image.id} className="group relative">
                            <img
                                src={image.url}
                                alt={image.name}
                                className="aspect-square w-full rounded-lg border object-cover"
                            />
                            <RemoveAsset
                                productId={productId}
                                id={image.id}
                                name={image.name}
                                className="absolute end-1 top-1 bg-background/90"
                            />
                        </div>
                    ))}
                </div>
            </AssetSection>

            <AssetSection
                productId={productId}
                kind="file"
                title={t('Downloadable files')}
                hint={t(
                    'Delivered to buyers after purchase. Up to 5 files, 45 MB each.',
                )}
                empty={t('No files uploaded yet')}
                accept=".pdf,.zip,.epub,.docx,.xlsx,.pptx,.csv,.txt,.mp3,.mp4"
                count={files.length}
                limit={5}
            >
                <ul className="space-y-2">
                    {files.map((file) => (
                        <li
                            key={file.id}
                            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                        >
                            <a
                                href={download.url({
                                    product: productSlug,
                                    asset: file.id,
                                })}
                                className="flex min-w-0 items-center gap-2 hover:underline"
                            >
                                <FileText className="size-4 shrink-0 text-muted-foreground" />
                                <span className="truncate">{file.name}</span>
                            </a>
                            <div className="flex shrink-0 items-center gap-2">
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {formatSize(file.size)}
                                </span>
                                <RemoveAsset
                                    productId={productId}
                                    id={file.id}
                                    name={file.name}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            </AssetSection>
        </>
    );
}

function AssetSection({
    productId,
    kind,
    title,
    hint,
    empty,
    accept,
    count,
    limit,
    children,
}: {
    productId: number;
    kind: 'image' | 'file';
    title: string;
    hint: string;
    empty: string;
    accept: string;
    count: number;
    limit: number;
    children: React.ReactNode;
}) {
    const { t } = useTranslation();
    const input = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string>();

    const upload = (list: FileList | null) => {
        if (!list?.length) {
            return;
        }

        router.post(
            assets.store.url(productId),
            { kind, uploads: Array.from(list) },
            {
                forceFormData: true,
                preserveScroll: true,
                preserveState: true,
                onStart: () => {
                    setUploading(true);
                    setError(undefined);
                },
                onError: (errors) =>
                    setError(Object.values(errors)[0] as string | undefined),
                onFinish: () => {
                    setUploading(false);

                    if (input.current) {
                        input.current.value = '';
                    }
                },
            },
        );
    };

    return (
        <Card className="gap-4 p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="font-medium">{title}</h3>
                    <p className="text-sm text-muted-foreground">{hint}</p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    disabled={uploading || count >= limit}
                    onClick={() => input.current?.click()}
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
            {count === 0 ? (
                <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                    {empty}
                </p>
            ) : (
                children
            )}
            <InputError message={error} />
        </Card>
    );
}

function RemoveAsset({
    productId,
    id,
    name,
    className,
}: {
    productId: number;
    id: number;
    name: string;
    className?: string;
}) {
    const { t } = useTranslation();

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`size-7 text-destructive hover:text-destructive ${className ?? ''}`}
            aria-label={t('Remove :name', { name })}
            onClick={() =>
                router.delete(
                    assets.destroy.url({ product: productId, asset: id }),
                    { preserveScroll: true, preserveState: true },
                )
            }
        >
            <Trash2 />
        </Button>
    );
}
