import { Head } from '@inertiajs/react';
import { Info, Plus } from 'lucide-react';

import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/ProductTypeController';
import CatalogSheet from '@/components/catalog/catalog-sheet';
import DeleteDialog from '@/components/delete-dialog';
import EmptyState from '@/components/empty-state';
import InputError from '@/components/input-error';
import PageHeader from '@/components/page-header';
import RowActions from '@/components/row-actions';
import TypeSwatch from '@/components/type-swatch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCrudState } from '@/hooks/use-crud-state';
import { formatCount, formatNumber } from '@/lib/format';
import type { ProductType } from '@/types';

type Props = {
    productTypes: ProductType[];
};

export default function ProductTypesIndex({ productTypes }: Props) {
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
    } = useCrudState(productTypes, (id) => destroy.url(id));

    const usageParts = deleting
        ? [
              deleting.ordersCount > 0 &&
                  formatCount(deleting.ordersCount, 'order'),
              deleting.productsCount > 0 &&
                  formatCount(deleting.productsCount, 'product'),
          ].filter(Boolean)
        : [];
    const isBlocked = usageParts.length > 0;

    return (
        <>
            <Head title="Product types" />

            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 p-4 md:gap-6 md:p-6">
                <PageHeader
                    title="Product types"
                    description="Speed and changeover time drive the plan. Editing them recalculates every order of that type."
                    actions={
                        <Button variant="outline" onClick={openNew}>
                            <Plus />
                            Add product type
                        </Button>
                    }
                />

                {productTypes.length === 0 ? (
                    <EmptyState
                        title="No product types yet"
                        description="Add the first one to use it in orders."
                        action={
                            <Button onClick={openNew}>
                                <Plus />
                                Add product type
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
                                        Speed
                                    </th>
                                    <th className="hidden px-4 text-right font-semibold md:table-cell">
                                        Changeover
                                    </th>
                                    <th className="hidden px-4 text-right font-semibold md:table-cell">
                                        Products
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
                                {productTypes.map((productType) => (
                                    <tr
                                        key={productType.id}
                                        className="h-[54px] border-b last:border-b-0"
                                    >
                                        <td className="px-4 font-medium">
                                            <span className="flex items-center gap-2">
                                                <TypeSwatch
                                                    productTypeId={
                                                        productType.id
                                                    }
                                                />
                                                {productType.name}
                                            </span>
                                        </td>
                                        <td className="hidden px-4 text-right tabular-nums md:table-cell">
                                            {formatNumber(
                                                productType.unitsPerHour,
                                            )}{' '}
                                            units/h
                                        </td>
                                        <td className="hidden px-4 text-right tabular-nums md:table-cell">
                                            {productType.changeoverMinutes} min
                                        </td>
                                        <td className="hidden px-4 text-right tabular-nums md:table-cell">
                                            {formatNumber(
                                                productType.productsCount,
                                            )}
                                        </td>
                                        <td className="hidden px-4 text-right tabular-nums md:table-cell">
                                            {formatNumber(
                                                productType.ordersCount,
                                            )}
                                        </td>
                                        <td className="px-4">
                                            <RowActions
                                                label={productType.name}
                                                onEdit={() =>
                                                    openEdit(productType)
                                                }
                                                onDelete={() =>
                                                    openDelete(productType)
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
                title={editing ? 'Edit product type' : 'New product type'}
                subtitle={
                    editing ? editing.name : 'Fill in the fields, then save.'
                }
                form={editing ? update.form(editing.id) : store.form()}
                submitLabel={editing ? 'Save changes' : 'Add product type'}
                notice={
                    editing && editing.ordersCount > 0 ? (
                        <div
                            role="status"
                            className="flex gap-2 rounded-lg border border-info-border bg-info-soft p-3 text-sm text-info-soft-foreground"
                        >
                            <Info className="mt-0.5 size-4 shrink-0" />
                            <p>
                                <strong className="font-semibold">
                                    Used by{' '}
                                    {formatCount(editing.ordersCount, 'order')}
                                </strong>{' '}
                                — Changing speed or changeover time recalculates
                                the plan.
                            </p>
                        </div>
                    ) : null
                }
            >
                {({ errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="product-type-name">Name</Label>
                            <Input
                                id="product-type-name"
                                name="name"
                                defaultValue={editing?.name ?? ''}
                                aria-invalid={!!errors.name}
                                placeholder="Product type name"
                                className="h-10"
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-2">
                                <Label htmlFor="units-per-hour">Speed</Label>
                                <div className="relative">
                                    <Input
                                        id="units-per-hour"
                                        name="units_per_hour"
                                        type="number"
                                        min={1}
                                        inputMode="numeric"
                                        defaultValue={
                                            editing?.unitsPerHour ?? ''
                                        }
                                        aria-invalid={!!errors.units_per_hour}
                                        className="h-10 pr-20 tabular-nums"
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                                        units/hour
                                    </span>
                                </div>
                                <InputError message={errors.units_per_hour} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="changeover-minutes">
                                    Changeover time
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="changeover-minutes"
                                        name="changeover_minutes"
                                        type="number"
                                        min={0}
                                        inputMode="numeric"
                                        defaultValue={
                                            editing?.changeoverMinutes ?? ''
                                        }
                                        aria-invalid={
                                            !!errors.changeover_minutes
                                        }
                                        aria-describedby="changeover-help"
                                        className="h-10 pr-12 tabular-nums"
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                                        min
                                    </span>
                                </div>
                                <InputError
                                    message={errors.changeover_minutes}
                                />
                            </div>
                        </div>
                        <p
                            id="changeover-help"
                            className="-mt-2 text-sm text-muted-foreground"
                        >
                            Changeover time is added when a machine switches to
                            this type from another one.
                        </p>
                    </>
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
                            ? `This product type is still used by ${usageParts.join(' and ')}. Change or delete them first, then try again.`
                            : 'No orders or products use this type.'
                    }
                    confirmLabel="Delete product type"
                    onConfirm={confirmDelete}
                    processing={processing}
                />
            )}
        </>
    );
}

ProductTypesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Product types',
            href: index(),
        },
    ],
};
