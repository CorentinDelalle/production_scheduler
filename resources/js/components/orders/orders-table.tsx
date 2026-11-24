import OrderStatusBadge from '@/components/orders/order-status-badge';
import UpdatedTag from '@/components/orders/updated-tag';
import RowActions from '@/components/row-actions';
import TypeSwatch from '@/components/type-swatch';
import { formatDateTime, formatDay, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { OrderRow } from '@/types';

type Props = {
    orders: OrderRow[];
    timezone: string;
    highlightId?: number;
    onEdit: (order: OrderRow) => void;
    onDelete: (order: OrderRow) => void;
};

/** Desktop table of orders, hidden on mobile. */
export default function OrdersTable({
    orders,
    timezone,
    highlightId,
    onEdit,
    onDelete,
}: Props) {
    return (
        <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
                    <tr>
                        <th className="h-10 px-4">Order</th>
                        <th className="px-4">Customer</th>
                        <th className="px-4">Product type</th>
                        <th className="px-4">Delivery</th>
                        <th className="px-4 text-right">Quantity</th>
                        <th className="px-4">Planned finish</th>
                        <th className="px-4">Status</th>
                        <th className="px-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => {
                        const highlighted = order.id === highlightId;

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
                                        onClick={() => onEdit(order)}
                                        className="font-mono font-semibold text-primary underline underline-offset-4"
                                    >
                                        #{order.id}
                                    </button>
                                </td>
                                <td className="px-4 font-medium">
                                    {order.customer}
                                    {highlighted && <UpdatedTag />}
                                </td>
                                <td className="px-4">
                                    <span className="flex items-center gap-2">
                                        <TypeSwatch
                                            productTypeId={order.productTypeId}
                                        />
                                        {order.productType}
                                    </span>
                                </td>
                                <td className="px-4 whitespace-nowrap">
                                    {formatDay(order.needByDate)}
                                </td>
                                <td className="px-4 text-right tabular-nums">
                                    {formatNumber(order.quantity)}
                                </td>
                                <td className="px-4 whitespace-nowrap">
                                    {order.end ? (
                                        <>
                                            {formatDateTime(
                                                order.end,
                                                timezone,
                                            )}
                                            <span className="block text-xs text-muted-foreground">
                                                {order.machine}
                                            </span>
                                        </>
                                    ) : (
                                        '—'
                                    )}
                                </td>
                                <td className="px-4">
                                    {order.isLate !== null && (
                                        <OrderStatusBadge late={order.isLate} />
                                    )}
                                </td>
                                <td className="px-4">
                                    <RowActions
                                        label={`order #${order.id}`}
                                        onEdit={() => onEdit(order)}
                                        onDelete={() => onDelete(order)}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
