import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    useEffect(() => {
        return router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data: FlashToast | undefined = flash?.toast;

            if (!data) {
                return;
            }

            toast[data.type](data.message);
        });
    }, []);
}
