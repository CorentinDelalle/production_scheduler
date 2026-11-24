import { Head } from '@inertiajs/react';
import { Info, Plus } from 'lucide-react';

import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/MachineController';
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
import type { Machine } from '@/types';

type Props = {
    machines: Machine[];
};

export default function MachinesIndex({ machines }: Props) {
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
    } = useCrudState(machines, (id) => destroy.url(id));

    const isBlocked = machines.length <= 1;

    return (
        <>
            <Head title="Machines" />

            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 p-4 md:gap-6 md:p-6">
                <PageHeader
                    title="Machines"
                    description="Each machine is one row on the plan. Adding or removing a machine recalculates the plan."
                    actions={
                        <Button variant="outline" onClick={openNew}>
                            <Plus />
                            Add machine
                        </Button>
                    }
                />

                {machines.length === 0 ? (
                    <EmptyState
                        title="No machines yet"
                        description="Add the first one to use it in the plan."
                        action={
                            <Button onClick={openNew}>
                                <Plus />
                                Add machine
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
                                    <th className="w-28 px-4 text-right font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {machines.map((machine) => (
                                    <tr
                                        key={machine.id}
                                        className="h-[54px] border-b last:border-b-0"
                                    >
                                        <td className="px-4 font-medium">
                                            {machine.name}
                                        </td>
                                        <td className="px-4">
                                            <RowActions
                                                label={machine.name}
                                                onEdit={() => openEdit(machine)}
                                                onDelete={() =>
                                                    openDelete(machine)
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
                title={editing ? 'Edit machine' : 'New machine'}
                subtitle={
                    editing ? editing.name : 'Fill in the fields, then save.'
                }
                form={editing ? update.form(editing.id) : store.form()}
                submitLabel={editing ? 'Save changes' : 'Add machine'}
                notice={
                    editing ? null : (
                        <div
                            role="status"
                            className="flex gap-2 rounded-lg border border-info-border bg-info-soft p-3 text-sm text-info-soft-foreground"
                        >
                            <Info className="mt-0.5 size-4 shrink-0" />
                            <p>
                                <strong className="font-semibold">
                                    The plan will be recalculated
                                </strong>{' '}
                                — Orders are spread over all machines, so adding
                                one moves some orders.
                            </p>
                        </div>
                    )
                }
            >
                {({ errors }) => (
                    <div className="grid gap-2">
                        <Label htmlFor="machine-name">Name</Label>
                        <Input
                            id="machine-name"
                            name="name"
                            defaultValue={editing?.name ?? ''}
                            aria-invalid={!!errors.name}
                            placeholder="Machine name"
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
                            ? 'The plan needs at least one machine. Add another machine first.'
                            : 'Its orders will be moved to the other machines and the plan recalculated.'
                    }
                    confirmLabel="Delete machine"
                    onConfirm={confirmDelete}
                    processing={processing}
                />
            )}
        </>
    );
}

MachinesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Machines',
            href: index(),
        },
    ],
};
