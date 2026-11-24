import { Head, usePage } from '@inertiajs/react';
import { ClipboardList, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import DeleteDialog from '@/components/delete-dialog';
import EmptyState from '@/components/empty-state';
import OrderFormSheet from '@/components/orders/order-form-sheet';
import OrdersTable from '@/components/orders/orders-table';
import OrderCard from '@/components/orders/order-card';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCrudState } from '@/hooks/use-crud-state';
import { formatNumber } from '@/lib/format';
import { destroy } from '@/actions/App/Http/Controllers/OrderController';
import { index } from '@/routes/orders';
import type { OrderFormOptions, OrderRow } from '@/types';

type Props = OrderFormOptions & {
    start: string;
    timezone: string;
    orders: OrderRow[];
};

type Filter = 'all' | 'onTime' | 'late';

export default function Orders({
    timezone,
    orders,
    customers,
    productTypes,
}: Props) {
    const flash = usePage().flash;
    const highlightId = flash?.highlight;

    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
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
    } = useCrudState(orders, (id) => destroy.url(id));

    const lateCount = orders.filter((o) => o.isLate === true).length;
    const onTimeCount = orders.filter((o) => o.isLate === false).length;

    const needle = query.trim().toLowerCase().replace(/^#/, '');
    const rows = orders.filter((order) => {
        if (filter === 'late' && order.isLate !== true) {
            return false;
        }

        if (filter === 'onTime' && order.isLate !== false) {
            return false;
        }

        return (
            needle === '' ||
            String(order.id).includes(needle) ||
            order.customer.toLowerCase().includes(needle) ||
            order.productType.toLowerCase().includes(needle)
        );
    });

    function clearFilters() {
        setQuery('');
        setFilter('all');
    }

    const filters: { key: Filter; label: string }[] = [
        { key: 'all', label: `All (${orders.length})` },
        { key: 'onTime', label: `On time (${onTimeCount})` },
        { key: 'late', label: `Late (${lateCount})` },
    ];

    const newOrderButton = (
        <Button onClick={openNew}>
            <Plus />
            New order
        </Button>
    );

    return (
        <>
            <Head title="Orders" />
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 p-4 md:gap-6 md:p-6">
                <PageHeader
                    title="Orders"
                    description={`${orders.length} ${orders.length === 1 ? 'order' : 'orders'} · ${lateCount} late`}
                    actions={newOrderButton}
                />

                {orders.length === 0 ? (
                    <EmptyState
                        icon={<ClipboardList className="size-6" />}
                        title="No orders yet"
                        description="Add your first order. The plan is calculated as soon as you save it."
                        action={newOrderButton}
                    />
                ) : (
                    <>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative max-w-sm min-w-60 flex-1">
                                <Search
                                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                                    aria-hidden
                                />
                                <Input
                                    type="search"
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Search customer, order no. or type"
                                    aria-label="Search orders"
                                    className="pl-9"
                                />
                            </div>
                            <ToggleGroup
                                type="single"
                                value={filter}
                                onValueChange={(value) => {
                                    if (value) {
                                        setFilter(value as Filter);
                                    }
                                }}
                                aria-label="Status"
                                className="rounded-lg bg-muted p-[3px]"
                            >
                                {filters.map(({ key, label }) => (
                                    <ToggleGroupItem
                                        key={key}
                                        value={key}
                                        className="h-8 rounded-md px-3 whitespace-nowrap text-muted-foreground first:rounded-md last:rounded-md hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-xs"
                                    >
                                        {label}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </div>

                        {rows.length === 0 ? (
                            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
                                No orders match this search.{' '}
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="font-semibold text-primary underline underline-offset-4"
                                >
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <OrdersTable
                                    orders={rows}
                                    timezone={timezone}
                                    highlightId={highlightId}
                                    onEdit={openEdit}
                                    onDelete={openDelete}
                                />

                                <ul className="flex flex-col gap-2 md:hidden">
                                    {rows.map((order) => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            timezone={timezone}
                                            highlighted={
                                                order.id === highlightId
                                            }
                                            onEdit={openEdit}
                                            onDelete={openDelete}
                                        />
                                    ))}
                                </ul>
                            </>
                        )}
                    </>
                )}
            </div>

            <OrderFormSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                order={editing}
                customers={customers}
                productTypes={productTypes}
            />

            {deleting && (
                <DeleteDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    title={`Delete order #${deleting.id}?`}
                    description={`${deleting.customer} · ${formatNumber(deleting.quantity)} units. The plan will be recalculated without it.`}
                    confirmLabel="Delete order"
                    onConfirm={confirmDelete}
                    processing={processing}
                />
            )}
        </>
    );
}

Orders.layout = {
    breadcrumbs: [
        {
            title: 'Orders',
            href: index(),
        },
    ],
};
