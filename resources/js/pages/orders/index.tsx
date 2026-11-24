import { Head, router, usePage } from '@inertiajs/react';
import { ClipboardList, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeleteDialog from '@/components/delete-dialog';
import EmptyState from '@/components/empty-state';
import OrderFormSheet from '@/components/orders/order-form-sheet';
import OrderStatusBadge from '@/components/orders/order-status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TypeSwatch from '@/components/type-swatch';
import { formatDateTime, formatDay, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { destroy } from '@/actions/App/Http/Controllers/OrderController';
import { index } from '@/routes/orders';
import type { EditableOrder, OrderFormOptions, OrderRow } from '@/types';

type Props = OrderFormOptions & {
    start: string;
    timezone: string;
    orders: OrderRow[];
};

type Filter = 'all' | 'onTime' | 'late';

const mono = 'font-mono font-semibold';

export default function Orders({
    timezone,
    orders,
    customers,
    productTypes,
}: Props) {
    const flash = usePage().flash as { highlight?: number } | undefined;
    const highlightId = flash?.highlight;

    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editing, setEditing] = useState<EditableOrder | null>(null);
    const [deleting, setDeleting] = useState<OrderRow | null>(null);
    const [processing, setProcessing] = useState(false);

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

    function openNew() {
        setEditing(null);
        setSheetOpen(true);
    }

    function openEdit(order: OrderRow) {
        setEditing(order);
        setSheetOpen(true);
    }

    function clearFilters() {
        setQuery('');
        setFilter('all');
    }

    function confirmDelete() {
        if (!deleting) {
            return;
        }

        router.delete(destroy(deleting.id).url, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => {
                setProcessing(false);
                setDeleting(null);
            },
        });
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
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Orders
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {orders.length}{' '}
                            {orders.length === 1 ? 'order' : 'orders'} ·{' '}
                            {lateCount} late
                        </p>
                    </div>
                    {newOrderButton}
                </div>

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
                            <div
                                role="group"
                                aria-label="Status"
                                className="flex rounded-lg bg-muted p-[3px]"
                            >
                                {filters.map(({ key, label }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        aria-pressed={filter === key}
                                        onClick={() => setFilter(key)}
                                        className={cn(
                                            'h-8 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                                            filter === key
                                                ? 'bg-background shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
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
                                <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
                                    <table className="w-full text-sm">
                                        <thead className="border-b bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
                                            <tr>
                                                <th className="h-10 px-4">
                                                    Order
                                                </th>
                                                <th className="px-4">
                                                    Customer
                                                </th>
                                                <th className="px-4">
                                                    Product type
                                                </th>
                                                <th className="px-4">
                                                    Delivery
                                                </th>
                                                <th className="px-4 text-right">
                                                    Quantity
                                                </th>
                                                <th className="px-4">
                                                    Planned finish
                                                </th>
                                                <th className="px-4">Status</th>
                                                <th className="px-4 text-right">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((order) => {
                                                const highlighted =
                                                    order.id === highlightId;

                                                return (
                                                    <tr
                                                        key={order.id}
                                                        className={cn(
                                                            'border-b last:border-b-0',
                                                            highlighted &&
                                                                'bg-primary/5 shadow-[inset_3px_0_0_var(--primary)]',
                                                        )}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openEdit(
                                                                        order,
                                                                    )
                                                                }
                                                                className={cn(
                                                                    mono,
                                                                    'text-primary underline underline-offset-4',
                                                                )}
                                                            >
                                                                #{order.id}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 font-medium">
                                                            {order.customer}
                                                            {highlighted && (
                                                                <UpdatedTag />
                                                            )}
                                                        </td>
                                                        <td className="px-4">
                                                            <span className="flex items-center gap-2">
                                                                <TypeSwatch
                                                                    productTypeId={
                                                                        order.productTypeId
                                                                    }
                                                                />
                                                                {
                                                                    order.productType
                                                                }
                                                            </span>
                                                        </td>
                                                        <td className="px-4 whitespace-nowrap">
                                                            {formatDay(
                                                                order.needByDate,
                                                            )}
                                                        </td>
                                                        <td className="px-4 text-right tabular-nums">
                                                            {formatNumber(
                                                                order.quantity,
                                                            )}
                                                        </td>
                                                        <td className="px-4 whitespace-nowrap">
                                                            {order.end ? (
                                                                <>
                                                                    {formatDateTime(
                                                                        order.end,
                                                                        timezone,
                                                                    )}
                                                                    <span className="block text-xs text-muted-foreground">
                                                                        {
                                                                            order.machine
                                                                        }
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                '—'
                                                            )}
                                                        </td>
                                                        <td className="px-4">
                                                            {order.isLate !==
                                                                null && (
                                                                <OrderStatusBadge
                                                                    late={
                                                                        order.isLate
                                                                    }
                                                                />
                                                            )}
                                                        </td>
                                                        <td className="px-4">
                                                            <div className="flex justify-end gap-1">
                                                                <RowActions
                                                                    order={
                                                                        order
                                                                    }
                                                                    onEdit={() =>
                                                                        openEdit(
                                                                            order,
                                                                        )
                                                                    }
                                                                    onDelete={() =>
                                                                        setDeleting(
                                                                            order,
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <ul className="flex flex-col gap-2 md:hidden">
                                    {rows.map((order) => {
                                        const highlighted =
                                            order.id === highlightId;

                                        return (
                                            <li
                                                key={order.id}
                                                className={cn(
                                                    'flex items-start gap-3 rounded-xl border bg-card p-3',
                                                    highlighted &&
                                                        'bg-primary/5 shadow-[inset_3px_0_0_var(--primary)]',
                                                )}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(order)
                                                    }
                                                    className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span
                                                            className={cn(
                                                                mono,
                                                                'text-sm',
                                                            )}
                                                        >
                                                            #{order.id}
                                                        </span>
                                                        <span className="truncate font-semibold">
                                                            {order.customer}
                                                        </span>
                                                        {highlighted && (
                                                            <UpdatedTag />
                                                        )}
                                                    </span>
                                                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <TypeSwatch
                                                            productTypeId={
                                                                order.productTypeId
                                                            }
                                                        />
                                                        {order.productType} ·{' '}
                                                        {formatNumber(
                                                            order.quantity,
                                                        )}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        Due{' '}
                                                        {formatDay(
                                                            order.needByDate,
                                                        )}
                                                    </span>
                                                    {order.end && (
                                                        <span className="text-sm text-muted-foreground">
                                                            Finish{' '}
                                                            {formatDateTime(
                                                                order.end,
                                                                timezone,
                                                            )}{' '}
                                                            · {order.machine}
                                                        </span>
                                                    )}
                                                    {order.isLate !== null && (
                                                        <OrderStatusBadge
                                                            late={order.isLate}
                                                            className="mt-1"
                                                        />
                                                    )}
                                                </button>
                                                <div className="flex flex-col gap-1">
                                                    <RowActions
                                                        order={order}
                                                        onEdit={() =>
                                                            openEdit(order)
                                                        }
                                                        onDelete={() =>
                                                            setDeleting(order)
                                                        }
                                                    />
                                                </div>
                                            </li>
                                        );
                                    })}
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

            <DeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleting(null);
                    }
                }}
                title={deleting ? `Delete order #${deleting.id}?` : ''}
                description={
                    deleting
                        ? `${deleting.customer} · ${formatNumber(deleting.quantity)} units. The plan will be recalculated without it.`
                        : ''
                }
                confirmLabel="Delete order"
                onConfirm={confirmDelete}
                processing={processing}
            />
        </>
    );
}

function UpdatedTag() {
    return (
        <span className="ml-2 rounded bg-primary px-1.5 py-px text-[11px] font-bold text-primary-foreground">
            Updated
        </span>
    );
}

function RowActions({
    order,
    onEdit,
    onDelete,
}: {
    order: OrderRow;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onEdit}
                aria-label={`Edit order #${order.id}`}
                title="Edit"
            >
                <Pencil />
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDelete}
                aria-label={`Delete order #${order.id}`}
                title="Delete"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
                <Trash2 />
            </Button>
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
