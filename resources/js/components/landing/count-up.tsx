import { useEffect, useRef, useState } from 'react';

/**
 * Counts from 0 up to `value` the first time it scrolls into view.
 */
export function CountUp({
    value,
    decimals = 0,
    suffix = '',
    duration = 1600,
}: {
    value: number;
    decimals?: number;
    suffix?: string;
    duration?: number;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const [current, setCurrent] = useState(() =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? value
            : 0,
    );

    useEffect(() => {
        const el = ref.current;

        if (
            !el ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            return;
        }

        let frame = 0;
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) {
                return;
            }

            observer.disconnect();
            const start = performance.now();
            const tick = (now: number) => {
                // The first frame can be stamped slightly before `start`; clamp so it never goes negative.
                const progress = Math.min(
                    Math.max((now - start) / duration, 0),
                    1,
                );
                const eased = 1 - (1 - progress) ** 3;
                setCurrent(value * eased);

                if (progress < 1) {
                    frame = requestAnimationFrame(tick);
                }
            };
            frame = requestAnimationFrame(tick);
        });
        observer.observe(el);

        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [value, duration]);

    const final = `${value.toFixed(decimals)}${suffix}`;

    return (
        <span ref={ref}>
            <span aria-hidden>
                {current.toFixed(decimals)}
                {suffix}
            </span>
            <span className="sr-only">{final}</span>
        </span>
    );
}
