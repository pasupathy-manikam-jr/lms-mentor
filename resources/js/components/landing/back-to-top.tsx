import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';

export function BackToTop({ onClick }: { onClick: () => void }) {
    const [visible, setVisible] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > window.innerHeight);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <Button
            size="icon"
            aria-label={t('Back to top')}
            onClick={onClick}
            tabIndex={visible ? 0 : -1}
            className={cn(
                'fixed right-6 bottom-6 z-40 size-11 rounded-full shadow-lg transition-all duration-300',
                visible
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-4 opacity-0',
            )}
        >
            <ArrowUp />
        </Button>
    );
}
