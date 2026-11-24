import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
    label: string;
    onEdit: () => void;
    onDelete: () => void;
    className?: string;
};

/** Edit and delete icon buttons for a table row or list item. */
export default function RowActions({
    label,
    onEdit,
    onDelete,
    className,
}: Props) {
    return (
        <div className={cn('flex justify-end gap-1', className)}>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10"
                title="Edit"
                aria-label={`Edit ${label}`}
                onClick={onEdit}
            >
                <Pencil />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10 text-danger hover:bg-danger-soft hover:text-danger"
                title="Delete"
                aria-label={`Delete ${label}`}
                onClick={onDelete}
            >
                <Trash2 />
            </Button>
        </div>
    );
}
