import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';

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
import PageHeader from '@/components/page-header';
import RowActions from '@/components/row-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCrudState } from '@/hooks/use-crud-state';
import { formatCount, formatNumber } from '@/lib/format';
import type { Customer } from '@/types';

type Props = {
    customers: Customer[];
};

export default function CustomersIndex({ customers }: Props) {
    const {
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
    } = useCrudState(customers, (id) => destroy.url(id));

    const isBlocked = deleting !== null && deleting.ordersCount > 0;

    return (
        <>
            <Head title="Customers" />

            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 p-4 md:gap-6 md:p-6">
                <PageHeader
                    title="Customers"
                    description="Companies you print for. A customer can’t be deleted while it has orders."
                    actions={
                        <Button variant="outline" onClick={openNew}>
                            <Plus />
                            Add customer
                        </Button>
                    }
                />

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
                                            <RowActions
                                                label={customer.name}
                                                onEdit={() =>
                                                    openEdit(customer)
                                                }
                                                onDelete={() =>
                                                    openDelete(customer)
                                                }
                                            />
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
