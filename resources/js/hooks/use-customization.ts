import { useSyncExternalStore } from 'react';

/**
 * Settings panel customizer: colour preset, font family and layout direction.
 * Stored like appearance (localStorage + cookie), so the Blade template can apply them on first paint.
 */
export const colorPresets = [
    { value: 'neutral', label: 'Neutral', swatch: 'oklch(0.205 0 0)' },
    { value: 'amber', label: 'Amber', swatch: 'oklch(0.769 0.188 70.08)' },
    {
        value: 'emerald',
        label: 'Emerald',
        swatch: 'oklch(0.596 0.145 163.225)',
    },
    { value: 'blue', label: 'Blue', swatch: 'oklch(0.546 0.245 262.881)' },
    { value: 'rose', label: 'Rose', swatch: 'oklch(0.586 0.253 17.585)' },
    { value: 'violet', label: 'Violet', swatch: 'oklch(0.541 0.281 293.009)' },
] as const;

export const fontFamilies = [
    {
        value: 'instrument-sans',
        label: 'Instrument Sans',
        css: "'Instrument Sans'",
    },
    { value: 'inter', label: 'Inter', css: "'Inter'" },
    { value: 'poppins', label: 'Poppins', css: "'Poppins'" },
] as const;

export type Customization = {
    themeColor: (typeof colorPresets)[number]['value'];
    font: (typeof fontFamilies)[number]['value'];
    direction: 'ltr' | 'rtl';
};

const defaults: Customization = {
    themeColor: 'neutral',
    font: 'instrument-sans',
    direction: 'ltr',
};

// Storage key per setting; the cookie names match what HandleAppearance reads.
const keys = {
    themeColor: 'theme_color',
    font: 'font',
    direction: 'direction',
} as const;

const listeners = new Set<() => void>();
let current: Customization = defaults;

const read = (): Customization => {
    const stored = (key: keyof Customization) =>
        localStorage.getItem(keys[key]) ?? defaults[key];

    return {
        themeColor: stored('themeColor') as Customization['themeColor'],
        font: stored('font') as Customization['font'],
        direction: stored('direction') === 'rtl' ? 'rtl' : 'ltr',
    };
};

const apply = ({ themeColor, font, direction }: Customization): void => {
    const root = document.documentElement;

    // The defaults need no attribute: plain CSS already covers them.
    if (themeColor === 'neutral') {
        delete root.dataset.themeColor;
    } else {
        root.dataset.themeColor = themeColor;
    }

    if (font === 'instrument-sans') {
        delete root.dataset.font;
    } else {
        root.dataset.font = font;
    }

    root.dir = direction;
};

export function initializeCustomization(): void {
    if (typeof window === 'undefined') {
        return;
    }

    current = read();
    apply(current);
}

export function useCustomization() {
    const customization = useSyncExternalStore(
        (callback) => {
            listeners.add(callback);

            return () => listeners.delete(callback);
        },
        () => current,
        () => defaults,
    );

    const update = <K extends keyof Customization>(
        key: K,
        value: Customization[K],
    ): void => {
        current = { ...current, [key]: value };
        localStorage.setItem(keys[key], value);
        document.cookie = `${keys[key]}=${value};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
        apply(current);
        listeners.forEach((listener) => listener());
    };

    return { customization, update };
}
