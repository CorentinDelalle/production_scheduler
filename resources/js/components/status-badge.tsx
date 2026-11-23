import { Check, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';

type Props = {
    late: boolean;
    label?: string;
    className?: string;
};

/** Late or on-time pill. The icon and text carry the meaning, not the colour alone. */
export default function StatusBadge({ late, label, className }: Props) {
    const Icon = late ? TriangleAlert : Check;

    return (
        <span
            className={cn(
                'inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                late
                    ? 'bg-[#fdecea] text-[#9b1c13] dark:bg-red-950/60 dark:text-red-300'
                    : 'bg-[#e3f3ec] text-[#0f5f47] dark:bg-emerald-950/60 dark:text-emerald-300',
                className,
            )}
        >
            <Icon className="size-3.5" aria-hidden />
            {label ?? (late ? 'Late' : 'On time')}
        </span>
    );
}
