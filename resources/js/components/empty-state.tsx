import type { ReactNode } from 'react';

type Props = {
    title: string;
    description: ReactNode;
    action?: ReactNode;
    icon?: ReactNode;
};

/** Placeholder for a list or timeline with no data yet. */
export default function EmptyState({
    title,
    description,
    action,
    icon,
}: Props) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-14 text-center">
            {icon && (
                <span className="flex size-12 items-center justify-center rounded-full bg-[#fbe3ee] text-primary dark:bg-primary/20">
                    {icon}
                </span>
            )}
            <div className="space-y-1">
                <p className="font-semibold text-foreground">{title}</p>
                <div className="text-sm text-muted-foreground">
                    {description}
                </div>
            </div>
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
