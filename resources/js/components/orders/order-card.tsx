import OrderStatusBadge from '@/components/orders/order-status-badge';
import UpdatedTag from '@/components/orders/updated-tag';
import RowActions from '@/components/row-actions';
import TypeSwatch from '@/components/type-swatch';
import { formatDateTime, formatDay, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { OrderRow } from '@/types';

type Props = {
    order: OrderRow;
    timezone: string;
    highlighted: boolean;
    onEdit: (order: OrderRow) => void;
    onDelete: (order: OrderRow) => void;
};

/** One order as a mobile list item. */
export default function OrderCard({
    order,
    timezone,
    highlighted,
    onEdit,
    onDelete,
}: Props) {
    return (
        <li
            className={cn(
                'flex items-start gap-3 rounded-xl border bg-card p-3',
                highlighted &&
                    'bg-primary/5 shadow-[inset_3px_0_0_var(--primary)]',
            )}
        >
            <button
                type="button"
                onClick={() => onEdit(order)}
                className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left"
            >
                <span className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">
                        #{order.id}
                    </span>
                    <span className="truncate font-semibold">
                        {order.customer}
                    </span>
                    {highlighted && <UpdatedTag />}
                </span>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TypeSwatch productTypeId={order.productTypeId} />
                    {order.productType} · {formatNumber(order.quantity)}
                </span>
                <span className="text-sm text-muted-foreground">
                    Due {formatDay(order.needByDate)}
                </span>
                {order.end && (
                    <span className="text-sm text-muted-foreground">
                        Finish {formatDateTime(order.end, timezone)} ·{' '}
                        {order.machine}
                    </span>
                )}
                {order.isLate !== null && (
                    <OrderStatusBadge late={order.isLate} className="mt-1" />
                )}
            </button>
            <RowActions
                label={`order #${order.id}`}
                onEdit={() => onEdit(order)}
                onDelete={() => onDelete(order)}
                className="flex-col justify-start"
            />
        </li>
    );
}
