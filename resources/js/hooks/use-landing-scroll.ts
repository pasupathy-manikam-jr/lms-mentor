import Lenis from 'lenis';
import Snap from 'lenis/snap';
import { useCallback, useEffect, useRef } from 'react';

// Height of the header once it has shrunk (h-14 in site-header.tsx), so sections stop just below it.
export const HEADER_OFFSET = 56;

/**
 * Landing page scrolling: sections fade in as they appear, and the page glides
 * (Lenis) and settles on the nearest section. Returns a scrollTo helper for links.
 */
export function useLandingScroll(): (target: string | number) => void {
    const lenisRef = useRef<Lenis | null>(null);

    // Fade each [data-reveal] section in the first time it scrolls into view (styles in app.css).
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        (entry.target as HTMLElement).dataset.reveal = 'shown';
                        observer.unobserve(entry.target);
                    }
                }
            },
            { rootMargin: '0px 0px -10% 0px' },
        );

        document.querySelectorAll('[data-reveal]').forEach((section) => {
            section
                .querySelectorAll('.grid')
                .forEach((grid) =>
                    Array.from(grid.children).forEach((card, i) =>
                        (card as HTMLElement).style.setProperty(
                            '--reveal-index',
                            String(i),
                        ),
                    ),
                );
            observer.observe(section);
        });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const lenis = new Lenis({ autoRaf: true });
        const snap = new Snap(lenis, { type: 'proximity', duration: 0.8 });
        lenisRef.current = lenis;

        let removeSnaps: (() => void)[] = [];
        const placeSnaps = () => {
            removeSnaps.forEach((remove) => remove());
            const sections = document.querySelectorAll<HTMLElement>(
                'main > section:not(:first-child), footer',
            );
            removeSnaps = [
                snap.add(0),
                ...Array.from(sections, (el) =>
                    snap.add(
                        el.getBoundingClientRect().top +
                            window.scrollY -
                            HEADER_OFFSET,
                    ),
                ),
            ];
        };
        const resizeObserver = new ResizeObserver(placeSnaps);
        resizeObserver.observe(document.body);

        return () => {
            resizeObserver.disconnect();
            snap.destroy();
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    return useCallback((target: string | number) => {
        if (lenisRef.current) {
            lenisRef.current.scrollTo(target, {
                offset: typeof target === 'number' ? 0 : -HEADER_OFFSET,
            });

            return;
        }

        const top =
            typeof target === 'number'
                ? target
                : (document.querySelector(target)?.getBoundingClientRect()
                      .top ?? 0) +
                  window.scrollY -
                  HEADER_OFFSET;

        window.scrollTo({ top });
    }, []);
}
