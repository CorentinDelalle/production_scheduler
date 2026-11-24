import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/CustomerController';
import CatalogSheet from '@/components/catalog/catalog-sheet';
import DeleteDialog from '@/components/delete-dialog';
import EmptyState from '@/components/empty-state';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCount, formatNumber } from '@/lib/format';
import type { Customer } from '@/types';

type Props = {
    customers: Customer[];
};

export default function CustomersIndex({ customers }: Props) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    const editing =
        customers.find((customer) => customer.id === editingId) ?? null;
    const deleting =
        customers.find((customer) => customer.id === deletingId) ?? null;

    function openNew(): void {
        setEditingId(null);
        setSheetOpen(true);
    }

    function openEdit(customer: Customer): void {
        setEditingId(customer.id);
        setSheetOpen(true);
    }

    function openDelete(customer: Customer): void {
        setDeletingId(customer.id);
        setDeleteOpen(true);
    }

    function confirmDelete(): void {
        if (!deleting) {
            return;
        }

        router.delete(destroy.url(deleting.id), {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => {
                setProcessing(false);
                setDeleteOpen(false);
            },
        });
    }

    const isBlocked = deleting !== null && deleting.ordersCount > 0;

    return (
        <>
            <Head title="Customers" />

            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 p-4 md:gap-6 md:p-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Customers
                        </h1>
                        <p className="max-w-xl text-sm text-muted-foreground">
                            Companies you print for. A customer can’t be deleted
                            while it has orders.
                        </p>
                    </div>
                    <Button variant="outline" onClick={openNew}>
                        <Plus />
                        Add customer
                    </Button>
                </div>

                {customers.length === 0 ? (
                    <EmptyState
                        title="No customers yet"
                        description="Add the first one to use it in orders."
                        action={
                            <Button onClick={openNew}>
                                <Plus />
                                Add customer
                            </Button>
                        }
                    />
                ) : (
                    <div className="overflow-hidden rounded-xl border bg-card">
                        <table className="w-full text-sm">
                            <thead className="bg-muted text-xs font-semibold text-muted-foreground">
                                <tr className="h-10 border-b">
                                    <th className="px-4 text-left font-semibold">
                                        Name
                                    </th>
                                    <th className="hidden px-4 text-right font-semibold md:table-cell">
                                        Orders
                                    </th>
                                    <th className="w-28 px-4 text-right font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer) => (
                                    <tr
                                        key={customer.id}
                                        className="h-[54px] border-b last:border-b-0"
                                    >
                                        <td className="px-4 font-medium">
                                            {customer.name}
                                        </td>
                                        <td className="hidden px-4 text-right tabular-nums md:table-cell">
                                            {formatNumber(customer.ordersCount)}
                                        </td>
                                        <td className="px-4">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-10"
                                                    title="Edit"
                                                    aria-label={`Edit ${customer.name}`}
                                                    onClick={() =>
                                                        openEdit(customer)
                                                    }
                                                >
                                                    <Pencil />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-10 text-danger hover:bg-danger-soft hover:text-danger"
                                                    title="Delete"
                                                    aria-label={`Delete ${customer.name}`}
                                                    onClick={() =>
                                                        openDelete(customer)
                                                    }
                                                >
                                                    <Trash2 />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CatalogSheet
                key={editing?.id ?? 'new'}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                title={editing ? 'Edit customer' : 'New customer'}
                subtitle={
                    editing ? editing.name : 'Fill in the fields, then save.'
                }
                form={editing ? update.form(editing.id) : store.form()}
                submitLabel={editing ? 'Save changes' : 'Add customer'}
            >
                {({ errors }) => (
                    <div className="grid gap-2">
                        <Label htmlFor="customer-name">Name</Label>
                        <Input
                            id="customer-name"
                            name="name"
                            defaultValue={editing?.name ?? ''}
                            aria-invalid={!!errors.name}
                            placeholder="Customer name"
                            className="h-10"
                        />
                        <InputError message={errors.name} />
                    </div>
                )}
            </CatalogSheet>

            {deleting && (
                <DeleteDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    blocked={isBlocked}
                    title={
                        isBlocked
                            ? `“${deleting.name}” can’t be deleted`
                            : `Delete “${deleting.name}”?`
                    }
                    description={
                        isBlocked
                            ? `This customer still has ${formatCount(deleting.ordersCount, 'order')}. Delete ${deleting.ordersCount === 1 ? 'it' : 'them'} first, then try again.`
                            : 'This customer has no orders.'
                    }
                    confirmLabel="Delete customer"
                    onConfirm={confirmDelete}
                    processing={processing}
                />
            )}
        </>
    );
}

CustomersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Customers',
            href: index(),
        },
    ],
};
