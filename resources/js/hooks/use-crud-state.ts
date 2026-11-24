import { router } from '@inertiajs/react';
import { useState } from 'react';

type CrudState<T> = {
    sheetOpen: boolean;
    setSheetOpen: (open: boolean) => void;
    editing: T | null;
    deleteOpen: boolean;
    setDeleteOpen: (open: boolean) => void;
    deleting: T | null;
    processing: boolean;
    openNew: () => void;
    openEdit: (record: T) => void;
    openDelete: (record: T) => void;
    confirmDelete: () => void;
};

/** Sheet, delete dialog and delete request state shared by the list pages. */
export function useCrudState<T extends { id: number }>(
    records: T[],
    destroyUrl: (id: number) => string,
): CrudState<T> {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    const editing = records.find((record) => record.id === editingId) ?? null;
    const deleting = records.find((record) => record.id === deletingId) ?? null;

    function openNew(): void {
        setEditingId(null);
        setSheetOpen(true);
    }

    function openEdit(record: T): void {
        setEditingId(record.id);
        setSheetOpen(true);
    }

    function openDelete(record: T): void {
        setDeletingId(record.id);
        setDeleteOpen(true);
    }

    function confirmDelete(): void {
        if (!deleting) {
            return;
        }

        router.delete(destroyUrl(deleting.id), {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => {
                setProcessing(false);
                setDeleteOpen(false);
            },
        });
    }

    return {
        sheetOpen,
        setSheetOpen,
        editing,
        deleteOpen,
        setDeleteOpen,
        deleting,
        processing,
        openNew,
        openEdit,
        openDelete,
        confirmDelete,
    };
}
