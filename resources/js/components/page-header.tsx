import type { ReactNode } from 'react';

type Props = {
    title: string;
    description: ReactNode;
    actions?: ReactNode;
};

/** Page title, description and primary actions shared by the list pages. */
export default function PageHeader({ title, description, actions }: Props) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {title}
                </h1>
                <p className="max-w-xl text-sm text-muted-foreground">
                    {description}
                </p>
            </div>
            {actions}
        </div>
    );
}
