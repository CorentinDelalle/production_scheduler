import { Head, router } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/ProductController';
import CatalogSheet from '@/components/catalog/catalog-sheet';
import DeleteDialog from '@/components/delete-dialog';
import EmptyState from '@/components/empty-state';
import InputError from '@/components/input-error';
import TypeSwatch from '@/components/type-swatch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatNumber } from '@/lib/format';

type Product = {
    id: number;
    name: string;
    productTypeId: number;
    productType: string;
    ordersCount: number;
};

type ProductTypeOption = {
    id: number;
    name: string;
};

type Props = {
    products: Product[];
    productTypes: ProductTypeOption[];
};

const plural = (count: number, noun: string): string =>
    `${formatNumber(count)} ${noun}${count === 1 ? '' : 's'}`;

export default function ProductsIndex({ products, productTypes }: Props) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    const editing =
        products.find((product) => product.id === editingId) ?? null;
    const deleting =
        products.find((product) => product.id === deletingId) ?? null;

    function openNew(): void {
        setEditingId(null);
        setSheetOpen(true);
    }

    function openEdit(product: Product): void {
        setEditingId(product.id);
        setSheetOpen(true);
    }

    function openDelete(product: Product): void {
        setDeletingId(product.id);
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
    const typeLocked = editing != null && editing.ordersCount > 0;

    return (
        <>
            <Head title="Products" />

            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 p-4 md:gap-6 md:p-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Products
                        </h1>
                        <p className="max-w-xl text-sm text-muted-foreground">
                            What can be ordered. In the order form, products are
                            filtered by the chosen type.
                        </p>
                    </div>
                    <Button variant="outline" onClick={openNew}>
                        <Plus />
                        Add product
                    </Button>
                </div>

                {products.length === 0 ? (
                    <EmptyState
                        title="No products yet"
                        description="Add the first one to use it in orders."
                        action={
                            <Button onClick={openNew}>
                                <Plus />
                                Add product
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
                                    <th className="px-4 text-left font-semibold">
                                        Product type
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
                                {products.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="h-[54px] border-b last:border-b-0"
                                    >
                                        <td className="px-4 font-medium">
                                            {product.name}
                                        </td>
                                        <td className="px-4">
                                            <span className="flex items-center gap-2">
                                                <TypeSwatch
                                                    productTypeId={
                                                        product.productTypeId
                                                    }
                                                />
                                                {product.productType}
                                            </span>
                                        </td>
                                        <td className="hidden px-4 text-right tabular-nums md:table-cell">
                                            {formatNumber(product.ordersCount)}
                                        </td>
                                        <td className="px-4">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-10"
                                                    title="Edit"
                                                    aria-label={`Edit ${product.name}`}
                                                    onClick={() =>
                                                        openEdit(product)
                                                    }
                                                >
                                                    <Pencil />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-10 text-danger hover:bg-danger-soft hover:text-danger"
                                                    title="Delete"
                                                    aria-label={`Delete ${product.name}`}
                                                    onClick={() =>
                                                        openDelete(product)
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
                title={editing ? 'Edit product' : 'New product'}
                subtitle={
                    editing ? editing.name : 'Fill in the fields, then save.'
                }
                form={editing ? update.form(editing.id) : store.form()}
                submitLabel={editing ? 'Save changes' : 'Add product'}
            >
                {({ errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="product-name">Name</Label>
                            <Input
                                id="product-name"
                                name="name"
                                defaultValue={editing?.name ?? ''}
                                aria-invalid={!!errors.name}
                                placeholder="Product name"
                                className="h-10"
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="product-type">Product type</Label>
                            {typeLocked && (
                                <input
                                    type="hidden"
                                    name="product_type_id"
                                    value={editing.productTypeId}
                                />
                            )}
                            <Select
                                name={
                                    typeLocked ? undefined : 'product_type_id'
                                }
                                disabled={typeLocked}
                                defaultValue={
                                    editing
                                        ? String(editing.productTypeId)
                                        : undefined
                                }
                            >
                                <SelectTrigger
                                    id="product-type"
                                    className="h-10 w-full"
                                    aria-invalid={!!errors.product_type_id}
                                >
                                    <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {productTypes.map((productType) => (
                                        <SelectItem
                                            key={productType.id}
                                            value={String(productType.id)}
                                        >
                                            {productType.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {typeLocked && (
                                <p className="text-sm text-muted-foreground">
                                    The type can’t change while the product is
                                    on orders.
                                </p>
                            )}
                            <InputError message={errors.product_type_id} />
                        </div>
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
                            ? `This product is on ${plural(deleting.ordersCount, 'order')}. Remove it from ${deleting.ordersCount === 1 ? 'that order' : 'those orders'} first, then try again.`
                            : 'No orders use this product.'
                    }
                    confirmLabel="Delete product"
                    onConfirm={confirmDelete}
                    processing={processing}
                />
            )}
        </>
    );
}

ProductsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Products',
            href: index(),
        },
    ],
};
