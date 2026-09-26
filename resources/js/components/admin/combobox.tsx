import { ChevronsUpDown, Search } from 'lucide-react';
import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type ComboboxOption = {
    value: string;
    label: string;
    /** Secondary text after the label, e.g. an instructor's title. */
    hint?: string;
    /** Indent the option under the one before it (subcategories). */
    nested?: boolean;
    /** What the closed trigger shows when this option is picked, if not the label. */
    selectedLabel?: string;
};

/**
 * A select with a search box, built on the dropdown menu. The search input keeps focus while typing:
 * key presses stop at the input so the menu's typeahead doesn't steal them, and hovering an option
 * doesn't move focus. Arrow down moves into the list; Enter picks the first match.
 */
export function Combobox({
    id,
    value,
    options,
    onChange,
    placeholder,
    searchPlaceholder,
    emptyText,
    invalid,
}: {
    id?: string;
    value: string;
    options: ComboboxOption[];
    onChange: (value: string) => void;
    placeholder: string;
    searchPlaceholder: string;
    emptyText: string;
    invalid?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const selected = options.find((option) => option.value === value);
    const needle = query.trim().toLowerCase();
    const matches = options.filter((option) =>
        `${option.selectedLabel ?? option.label} ${option.hint ?? ''}`
            .toLowerCase()
            .includes(needle),
    );

    const pick = (next: string) => {
        onChange(next);
        setOpen(false);
    };

    const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape' || event.key === 'Tab') {
            return;
        }

        event.stopPropagation();

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            listRef.current
                ?.querySelector<HTMLElement>('[role="menuitemradio"]')
                ?.focus();
        } else if (event.key === 'Enter' && matches[0]) {
            event.preventDefault();
            pick(matches[0].value);
        }
    };

    return (
        <DropdownMenu
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                setQuery('');

                // The menu focuses itself when it opens; move focus to the search box right after.
                if (next) {
                    requestAnimationFrame(() => searchRef.current?.focus());
                }
            }}
        >
            <DropdownMenuTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-invalid={invalid || undefined}
                    className="h-10 w-full justify-between rounded-lg bg-transparent px-3 font-normal dark:bg-transparent"
                >
                    <span
                        className={cn(
                            'truncate',
                            !selected && 'text-muted-foreground',
                        )}
                    >
                        {selected?.selectedLabel ??
                            selected?.label ??
                            placeholder}
                    </span>
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                className="w-(--radix-dropdown-menu-trigger-width) p-0"
            >
                <div className="flex items-center gap-2 border-b px-3">
                    <Search className="size-4 shrink-0 opacity-50" />
                    <input
                        ref={searchRef}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={onSearchKeyDown}
                        placeholder={searchPlaceholder}
                        className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                </div>
                <div ref={listRef} className="max-h-64 overflow-y-auto p-1">
                    {matches.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            {emptyText}
                        </p>
                    ) : (
                        <DropdownMenuRadioGroup
                            value={value}
                            onValueChange={pick}
                        >
                            {matches.map((option) => (
                                <DropdownMenuRadioItem
                                    key={option.value}
                                    value={option.value}
                                    onPointerMove={(event) =>
                                        event.preventDefault()
                                    }
                                    onPointerLeave={(event) =>
                                        event.preventDefault()
                                    }
                                    className={cn(
                                        'hover:bg-accent hover:text-accent-foreground',
                                        option.nested && 'ps-12',
                                    )}
                                >
                                    <span className="truncate">
                                        {option.label}
                                    </span>
                                    {option.hint && (
                                        <span className="ms-auto truncate text-xs text-muted-foreground">
                                            {option.hint}
                                        </span>
                                    )}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
