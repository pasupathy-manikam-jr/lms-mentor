import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

export type HeroSlide = { src: string; alt: string };

/**
 * Photos that cross-fade inside the hero circle. Pauses on hover and stays on
 * the first photo when the visitor prefers reduced motion.
 */
export function HeroCarousel({
    slides,
    interval = 5000,
}: {
    slides: HeroSlide[];
    interval?: number;
}) {
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (
            paused ||
            slides.length < 2 ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            return;
        }

        const timer = window.setInterval(
            () => setActive((i) => (i + 1) % slides.length),
            interval,
        );

        return () => window.clearInterval(timer);
    }, [paused, slides.length, interval]);

    const fade = (i: number) =>
        cn(
            'transition-opacity duration-[1200ms] ease-out',
            i === active ? 'opacity-100' : 'opacity-0',
        );

    return (
        <div
            className="relative aspect-square"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="absolute inset-0 overflow-hidden rounded-full bg-muted shadow-xl">
                {slides.map((slide, i) => (
                    <img
                        key={slide.src}
                        src={slide.src}
                        alt={t(slide.alt)}
                        aria-hidden={i !== active}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        // Framed on the upper part of the photo so faces stay inside the circle.
                        className={cn(
                            'absolute inset-0 size-full object-cover object-[center_30%]',
                            fade(i),
                        )}
                    />
                ))}
            </div>

            <div className="absolute inset-x-0 -bottom-7 flex justify-center gap-2">
                {slides.map((slide, i) => (
                    <button
                        key={slide.src}
                        type="button"
                        aria-label={t('Show photo :number of :total', {
                            number: i + 1,
                            total: slides.length,
                        })}
                        aria-current={i === active}
                        onClick={() => setActive(i)}
                        className={cn(
                            'h-2 rounded-full bg-foreground/25 transition-all duration-300 hover:bg-foreground/60',
                            i === active ? 'w-6 bg-foreground/70' : 'w-2',
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
