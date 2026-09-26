import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import Youtube from '@tiptap/extension-youtube';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    AlignCenter,
    AlignJustify,
    AlignLeft,
    AlignRight,
    Bold,
    CaseSensitive,
    ChevronDown,
    Code,
    ImageIcon,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Maximize,
    Minimize,
    Quote,
    Redo,
    Table,
    Underline,
    Undo,
    Youtube as YoutubeIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
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
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { editorImages } from '@/routes/admin/courses';

/** Swatches for text colour and highlight; the first entry resets. */
const TEXT_COLORS = [
    '',
    '#dc2626',
    '#ea580c',
    '#ca8a04',
    '#16a34a',
    '#0891b2',
    '#2563eb',
    '#7c3aed',
    '#db2777',
    '#71717a',
];
const HIGHLIGHT_COLORS = [
    '',
    '#fecaca',
    '#fed7aa',
    '#fef08a',
    '#bbf7d0',
    '#a5f3fc',
    '#bfdbfe',
    '#ddd6fe',
    '#fbcfe8',
    '#e4e4e7',
];

const ALIGNMENTS: { value: string; label: string; icon: LucideIcon }[] = [
    { value: 'left', label: 'Align left', icon: AlignLeft },
    { value: 'center', label: 'Align center', icon: AlignCenter },
    { value: 'right', label: 'Align right', icon: AlignRight },
    { value: 'justify', label: 'Justify', icon: AlignJustify },
];

type InsertKind = 'link' | 'image' | 'youtube';

/**
 * Rich-text editor (Tiptap) with the course form's toolbar. Emits HTML, or '' when empty; the server
 * sanitizes it before saving.
 */
export function RichTextEditor({
    id,
    value,
    onChange,
    placeholder,
    invalid,
}: {
    id?: string;
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    invalid?: boolean;
}) {
    const { t } = useTranslation();
    const [fullscreen, setFullscreen] = useState(false);
    const [inserting, setInserting] = useState<InsertKind | null>(null);

    const editor = useEditor({
        immediatelyRender: false,
        shouldRerenderOnTransaction: true,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3, 4] },
                link: { openOnClick: false, defaultProtocol: 'https' },
            }),
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Subscript,
            Superscript,
            Image,
            Youtube.configure({ nocookie: true }),
            TableKit.configure({ table: { resizable: false } }),
            Placeholder.configure({ placeholder }),
            CharacterCount,
        ],
        content: value,
        editorProps: {
            attributes: {
                ...(id ? { id } : {}),
                class: 'rich-text min-h-48 px-4 py-3 outline-none',
            },
        },
        onUpdate: ({ editor }) =>
            onChange(editor.isEmpty ? '' : editor.getHTML()),
    });

    if (!editor) {
        return (
            <div className="h-72 animate-pulse rounded-lg border bg-muted/40" />
        );
    }

    // Read on every render: the editor re-renders this component on each transaction.
    const state = {
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
        heading: ([1, 2, 3, 4] as const).find((level) =>
            editor.isActive('heading', { level }),
        ),
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        color:
            (editor.getAttributes('textStyle').color as string | undefined) ??
            '',
        highlight:
            (editor.getAttributes('highlight').color as string | undefined) ??
            '',
        align:
            ALIGNMENTS.find(({ value }) =>
                editor.isActive({ textAlign: value }),
            ) ?? ALIGNMENTS[0],
        bulletList: editor.isActive('bulletList'),
        orderedList: editor.isActive('orderedList'),
        blockquote: editor.isActive('blockquote'),
        link: editor.isActive('link'),
        codeBlock: editor.isActive('codeBlock'),
        inTable: editor.isActive('table'),
        words: editor.storage.characterCount.words() as number,
        characters: editor.storage.characterCount.characters() as number,
    };

    const chain = () => editor.chain().focus();

    return (
        <div
            className={cn(
                'flex flex-col overflow-hidden rounded-lg border border-input shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
                invalid && 'border-destructive',
                fullscreen && 'fixed inset-0 z-50 rounded-none bg-background',
            )}
        >
            <div className="flex flex-wrap items-center gap-0.5 border-b p-1">
                <ToolButton
                    label={t('Undo')}
                    icon={Undo}
                    disabled={!state.canUndo}
                    onClick={() => chain().undo().run()}
                />
                <ToolButton
                    label={t('Redo')}
                    icon={Redo}
                    disabled={!state.canRedo}
                    onClick={() => chain().redo().run()}
                />
                <Divider />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={t('Headings')}
                            className="min-w-26 justify-between px-2.5 font-normal"
                        >
                            {state.heading
                                ? t('Heading :level', { level: state.heading })
                                : t('Paragraph')}
                            <ChevronDown className="opacity-60" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem
                            onSelect={() => chain().setParagraph().run()}
                        >
                            {t('Paragraph')}
                        </DropdownMenuItem>
                        {([1, 2, 3, 4] as const).map((level) => (
                            <DropdownMenuItem
                                key={level}
                                onSelect={() =>
                                    chain().toggleHeading({ level }).run()
                                }
                            >
                                <span
                                    className={cn(
                                        'font-semibold',
                                        {
                                            1: 'text-xl',
                                            2: 'text-lg',
                                            3: 'text-base',
                                            4: 'text-sm',
                                        }[level],
                                    )}
                                >
                                    {t('Heading :level', { level })}
                                </span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Divider />

                <ToolButton
                    label={t('Bold')}
                    icon={Bold}
                    active={state.bold}
                    onClick={() => chain().toggleBold().run()}
                />
                <ToolButton
                    label={t('Italic')}
                    icon={Italic}
                    active={state.italic}
                    onClick={() => chain().toggleItalic().run()}
                />
                <ToolButton
                    label={t('Underline')}
                    icon={Underline}
                    active={state.underline}
                    onClick={() => chain().toggleUnderline().run()}
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={t('More format')}
                            className="gap-0.5 px-2"
                        >
                            <CaseSensitive className="size-5" />
                            <ChevronDown className="size-3 opacity-60" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem
                            onSelect={() => chain().toggleStrike().run()}
                        >
                            {t('Strikethrough')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => chain().toggleCode().run()}
                        >
                            {t('Inline code')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => chain().toggleSubscript().run()}
                        >
                            {t('Subscript')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => chain().toggleSuperscript().run()}
                        >
                            {t('Superscript')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() =>
                                chain().unsetAllMarks().clearNodes().run()
                            }
                        >
                            {t('Clear formatting')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Divider />

                <SwatchMenu
                    label={t('Color')}
                    colors={TEXT_COLORS}
                    current={state.color}
                    resetLabel={t('Default')}
                    onPick={(color) =>
                        color
                            ? chain().setColor(color).run()
                            : chain().unsetColor().run()
                    }
                >
                    <span className="text-base leading-none font-semibold">
                        A
                    </span>
                    <span
                        className="absolute inset-x-1.5 bottom-1 h-1 rounded-full"
                        style={{ background: state.color || 'currentColor' }}
                    />
                </SwatchMenu>
                <SwatchMenu
                    label={t('Highlight')}
                    colors={HIGHLIGHT_COLORS}
                    current={state.highlight}
                    resetLabel={t('None')}
                    onPick={(color) =>
                        color
                            ? chain().setHighlight({ color }).run()
                            : chain().unsetHighlight().run()
                    }
                >
                    <span
                        className="rounded-sm px-1 text-base leading-none font-semibold"
                        style={{ background: state.highlight || undefined }}
                    >
                        H
                    </span>
                </SwatchMenu>
                <Divider />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={t('Alignment')}
                            className="gap-0.5 px-2"
                        >
                            <state.align.icon className="size-5" />
                            <ChevronDown className="size-3 opacity-60" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {ALIGNMENTS.map((alignment) => (
                            <DropdownMenuItem
                                key={alignment.value}
                                onSelect={() =>
                                    chain().setTextAlign(alignment.value).run()
                                }
                            >
                                <alignment.icon />
                                {t(alignment.label)}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <ToolButton
                    label={t('Bullet list')}
                    icon={List}
                    active={state.bulletList}
                    onClick={() => chain().toggleBulletList().run()}
                />
                <ToolButton
                    label={t('Numbered list')}
                    icon={ListOrdered}
                    active={state.orderedList}
                    onClick={() => chain().toggleOrderedList().run()}
                />
                <Divider />

                <ToolButton
                    label={t('Quote')}
                    icon={Quote}
                    active={state.blockquote}
                    onClick={() => chain().toggleBlockquote().run()}
                />
                <ToolButton
                    label={t('Link')}
                    icon={LinkIcon}
                    active={state.link}
                    onClick={() => setInserting('link')}
                />
                <ToolButton
                    label={t('Image')}
                    icon={ImageIcon}
                    onClick={() => setInserting('image')}
                />
                <ToolButton
                    label={t('YouTube')}
                    icon={YoutubeIcon}
                    onClick={() => setInserting('youtube')}
                />
                <ToolButton
                    label={t('Code block')}
                    icon={Code}
                    active={state.codeBlock}
                    onClick={() => chain().toggleCodeBlock().run()}
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t('Table')}
                            className={cn(
                                'size-8',
                                state.inTable && 'bg-accent',
                            )}
                        >
                            <Table className="size-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem
                            onSelect={() =>
                                chain()
                                    .insertTable({
                                        rows: 3,
                                        cols: 3,
                                        withHeaderRow: true,
                                    })
                                    .run()
                            }
                        >
                            {t('Insert table')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            disabled={!state.inTable}
                            onSelect={() => chain().addRowAfter().run()}
                        >
                            {t('Add row')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            disabled={!state.inTable}
                            onSelect={() => chain().addColumnAfter().run()}
                        >
                            {t('Add column')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            disabled={!state.inTable}
                            onSelect={() => chain().deleteRow().run()}
                        >
                            {t('Delete row')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            disabled={!state.inTable}
                            onSelect={() => chain().deleteColumn().run()}
                        >
                            {t('Delete column')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            disabled={!state.inTable}
                            variant="destructive"
                            onSelect={() => chain().deleteTable().run()}
                        >
                            {t('Delete table')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <EditorContent
                editor={editor}
                className={cn(
                    'min-h-0 flex-1 overflow-y-auto',
                    !fullscreen && 'max-h-[32rem]',
                )}
            />

            <div className="flex items-center justify-between gap-4 border-t px-1 py-1 text-xs text-muted-foreground">
                <ToolButton
                    label={fullscreen ? t('Exit fullscreen') : t('Fullscreen')}
                    icon={fullscreen ? Minimize : Maximize}
                    onClick={() => setFullscreen(!fullscreen)}
                />
                <div className="flex gap-4 px-2 tabular-nums">
                    <span>{t('Words: :count', { count: state.words })}</span>
                    <span>
                        {t('Characters: :count', { count: state.characters })}
                    </span>
                </div>
            </div>

            {inserting && (
                <InsertDialog
                    key={inserting}
                    kind={inserting}
                    editor={editor}
                    onClose={() => setInserting(null)}
                />
            )}
        </div>
    );
}

function Divider() {
    return <div className="mx-1 h-5 w-px bg-border" aria-hidden />;
}

function ToolButton({
    label,
    icon: Icon,
    active,
    disabled,
    onClick,
}: {
    label: string;
    icon: LucideIcon;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            title={label}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'size-8',
                active && 'bg-accent text-accent-foreground',
            )}
        >
            <Icon className="size-5" />
        </Button>
    );
}

function SwatchMenu({
    label,
    colors,
    current,
    resetLabel,
    onPick,
    children,
}: {
    label: string;
    colors: string[];
    current: string;
    resetLabel: string;
    onPick: (color: string) => void;
    children: ReactNode;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={label}
                    title={label}
                    className="relative size-8"
                >
                    {children}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
                <div className="grid grid-cols-5 gap-1.5 p-1.5">
                    {colors.map((color) => (
                        <DropdownMenuItem
                            key={color || 'reset'}
                            onSelect={() => onPick(color)}
                            aria-label={color || resetLabel}
                            title={color || resetLabel}
                            className={cn(
                                'size-6 justify-center rounded-full border p-0 focus:ring-2 focus:ring-ring',
                                current.toLowerCase() === color.toLowerCase() &&
                                    'ring-2 ring-ring ring-offset-1',
                                !color &&
                                    'bg-[linear-gradient(135deg,transparent_45%,var(--destructive)_45%,var(--destructive)_55%,transparent_55%)]',
                            )}
                            style={color ? { background: color } : undefined}
                        />
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * One dialog for the three toolbar actions that need a URL: link, image (URL or upload) and YouTube video.
 */
function InsertDialog({
    kind,
    editor,
    onClose,
}: {
    kind: InsertKind;
    editor: Editor;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const [url, setUrl] = useState(() =>
        kind === 'link'
            ? ((editor.getAttributes('link').href as string | undefined) ?? '')
            : '',
    );
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);

    const titles: Record<InsertKind, string> = {
        link: t('Insert link'),
        image: t('Insert image'),
        youtube: t('Embed YouTube video'),
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        const chain = editor.chain().focus();

        if (kind === 'link') {
            (url.trim()
                ? chain.extendMarkRange('link').setLink({ href: url.trim() })
                : chain.extendMarkRange('link').unsetLink()
            ).run();
        } else if (kind === 'youtube') {
            if (!chain.setYoutubeVideo({ src: url.trim() }).run()) {
                return setError(t('Enter a valid YouTube link.'));
            }
        } else if (kind === 'image') {
            let src = url.trim();

            if (file) {
                setUploading(true);
                src = (await uploadImage(file)) ?? '';
                setUploading(false);
            }

            if (!src) {
                return setError(
                    file
                        ? t('The image could not be uploaded.')
                        : t('Choose an image or enter its URL.'),
                );
            }

            chain.setImage({ src }).run();
        }

        onClose();
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={submit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>{titles[kind]}</DialogTitle>
                    </DialogHeader>
                    {kind === 'image' && (
                        <div className="space-y-2">
                            <Label htmlFor="editor-image-file">
                                {t('Upload image')}
                            </Label>
                            <Input
                                id="editor-image-file"
                                type="file"
                                accept="image/*"
                                className="cursor-pointer"
                                onChange={(event) =>
                                    setFile(event.target.files?.[0] ?? null)
                                }
                            />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="editor-url">
                            {kind === 'image' ? t('Or image URL') : t('URL')}
                        </Label>
                        <Input
                            id="editor-url"
                            value={url}
                            onChange={(event) => setUrl(event.target.value)}
                            placeholder={
                                kind === 'youtube'
                                    ? 'https://www.youtube.com/watch?v=…'
                                    : 'https://'
                            }
                            disabled={kind === 'image' && file !== null}
                        />
                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            {t('Cancel')}
                        </Button>
                        <Button type="submit" disabled={uploading}>
                            {kind === 'link' &&
                            !url.trim() &&
                            editor.isActive('link')
                                ? t('Remove link')
                                : t('Insert')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

async function uploadImage(file: File): Promise<string | null> {
    const body = new FormData();
    body.append('image', file);
    const token = decodeURIComponent(
        document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
    );

    const response = await fetch(editorImages.url(), {
        method: 'POST',
        body,
        headers: { Accept: 'application/json', 'X-XSRF-TOKEN': token },
    });

    return response.ok
        ? ((await response.json()) as { url: string }).url
        : null;
}
