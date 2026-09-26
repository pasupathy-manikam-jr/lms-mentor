import { X } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';

/**
 * The demo's tag input (skills): type a value and press Enter or comma to add it; Backspace in the
 * empty box removes the last one.
 */
export function TagInput({
    id,
    value,
    onChange,
    placeholder,
}: {
    id?: string;
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}) {
    const { t } = useTranslation();
    const [draft, setDraft] = useState('');

    const add = () => {
        const tag = draft.trim().replace(/,$/, '');

        if (tag && !value.includes(tag)) {
            onChange([...value, tag]);
        }

        setDraft('');
    };

    return (
        <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg border px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring">
            {value.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 pe-1">
                    {tag}
                    <button
                        type="button"
                        onClick={() => onChange(value.filter((v) => v !== tag))}
                        className="rounded-sm hover:bg-background"
                        aria-label={t('Remove :name', { name: tag })}
                    >
                        <X className="size-3" />
                    </button>
                </Badge>
            ))}
            <input
                id={id}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ',') {
                        event.preventDefault();
                        add();
                    } else if (
                        event.key === 'Backspace' &&
                        draft === '' &&
                        value.length
                    ) {
                        onChange(value.slice(0, -1));
                    }
                }}
                onBlur={add}
                placeholder={value.length ? '' : placeholder}
                className="min-w-40 flex-1 bg-transparent px-1 text-sm outline-none"
            />
        </div>
    );
}
