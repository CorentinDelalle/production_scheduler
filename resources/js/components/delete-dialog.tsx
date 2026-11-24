import { Ban, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: ReactNode;
    /** True when the record cannot be deleted: shows an amber notice and a single OK button. */
    blocked?: boolean;
    confirmLabel?: string;
    onConfirm?: () => void;
    processing?: boolean;
};

/** Confirmation dialog for deletions, or a notice explaining why a record cannot be deleted. */
export default function DeleteDialog({
    open,
    onOpenChange,
    title,
    description,
    blocked = false,
    confirmLabel = 'Delete',
    onConfirm,
    processing = false,
}: Props) {
    const Icon = blocked ? Ban : Trash2;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-left">
                    <span
                        className={
                            blocked
                                ? 'mb-2 flex size-10 items-center justify-center rounded-lg bg-warning-soft text-warning-soft-foreground'
                                : 'mb-2 flex size-10 items-center justify-center rounded-lg bg-danger-soft text-danger-soft-foreground'
                        }
                        aria-hidden
                    >
                        <Icon className="size-5" />
                    </span>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    {blocked ? (
                        <Button onClick={() => onOpenChange(false)}>OK</Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={onConfirm}
                                disabled={processing}
                            >
                                {confirmLabel}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
