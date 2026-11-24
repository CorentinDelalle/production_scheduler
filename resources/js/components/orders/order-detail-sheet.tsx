import { router } from '@inertiajs/react';
import { TriangleAlert } from 'lucide-react';
import { useState } from 'react';

import DeleteDialog from '@/components/delete-dialog';
import OrderStatusBadge from '@/components/orders/order-status-badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { destroy } from '@/actions/App/Http/Controllers/OrderController';
import {
    formatDateTime,
    formatDay,
    formatDuration,
    formatNumber,
    minutesBetween,
} from '@/lib/format';
import { lateMinutes } from '@/lib/schedule';
import type {
    ProductTypeOption,
    ScheduleAssignment,
    ScheduleMachine,
} from '@/types';

type Props = {
    assignment: ScheduleAssignment | null;
    machines: ScheduleMachine[];
    productTypes: ProductTypeOption[];
    timezone: string;
    onClose: () => void;
    onEdit: (assignment: ScheduleAssignment) => void;
};

/** Side sheet with the full detail of a planned order, with delete and edit actions. */
export default function OrderDetailSheet({
    assignment,
    machines,
    productTypes,
    timezone,
    onClose,
    onEdit,
}: Props) {
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    if (!assignment) {
        return null;
    }

    const machine = machines.find((m) => m.id === assignment.machineId);
    const productType = productTypes.find(
        (type) => type.id === assignment.productTypeId,
    );
    const late = lateMinutes(assignment.needByDate, assignment.end, timezone);
    const changeover = Math.round(
        minutesBetween(assignment.changeoverStart, assignment.productionStart),
    );
    const needBy = formatDay(assignment.needByDate);
    const facts: [string, string][] = [
        ['Customer', assignment.customer],
        [
            'Product type',
            productType
                ? `${assignment.productType} · ${formatNumber(productType.unitsPerHour)} units/h`
                : assignment.productType,
        ],
        ['Need-by date', `${needBy}, by end of day`],
        ['Machine', machine?.name ?? '—'],
        ['Starts', formatDateTime(assignment.productionStart, timezone)],
        ['Finishes', formatDateTime(assignment.end, timezone)],
        [
            'Print time',
            formatDuration(
                minutesBetween(assignment.productionStart, assignment.end),
            ),
        ],
        ['Changeover before', changeover > 0 ? `${changeover} min` : 'None'],
    ];

    function confirmDelete() {
        if (!assignment) {
            return;
        }

        router.delete(destroy(assignment.orderId).url, {
            preserveScroll: true,
            onStart: () => setDeleting(true),
            onSuccess: () => {
                setConfirmingDelete(false);
                onClose();
            },
            onFinish: () => setDeleting(false),
        });
    }

    return (
        <>
            <Sheet
                open
                modal={false}
                onOpenChange={(open) => !open && onClose()}
            >
                <SheetContent className="w-full gap-0 sm:max-w-md">
                    <SheetHeader className="border-b pr-14 pl-6">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <SheetTitle className="text-[19px] tracking-tight">
                                Order #{assignment.orderId}
                            </SheetTitle>
                            <OrderStatusBadge
                                late={assignment.isLate}
                                label={
                                    assignment.isLate
                                        ? `Late by ${formatDuration(late)}`
                                        : 'On time'
                                }
                            />
                        </div>
                        <SheetDescription>
                            {assignment.customer}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-6 py-5">
                        {assignment.isLate && (
                            <div className="flex gap-2.5 rounded-lg border border-danger-border bg-danger-soft p-3 text-danger-soft-foreground">
                                <TriangleAlert
                                    className="mt-0.5 size-4 shrink-0"
                                    aria-hidden
                                />
                                <span>
                                    Finishes{' '}
                                    {formatDateTime(assignment.end, timezone)},
                                    which is {formatDuration(late)} after the
                                    end of its need-by day ({needBy}). Move the
                                    need-by date or shorten the queue on{' '}
                                    {machine?.name ?? 'its machine'}.
                                </span>
                            </div>
                        )}

                        <dl className="grid grid-cols-[130px_minmax(0,1fr)] gap-x-4 gap-y-2.5">
                            {facts.map(([label, value]) => (
                                <div key={label} className="contents">
                                    <dt className="text-muted-foreground">
                                        {label}
                                    </dt>
                                    <dd className="font-medium">{value}</dd>
                                </div>
                            ))}
                        </dl>

                        <div>
                            <h3 className="mb-2 text-sm font-semibold">
                                Products
                            </h3>
                            <div className="overflow-hidden rounded-lg border">
                                {assignment.items.map((item) => (
                                    <div
                                        key={item.productId}
                                        className="flex justify-between gap-3 border-b px-3 py-2.5"
                                    >
                                        <span>{item.product}</span>
                                        <span className="tabular-nums">
                                            {formatNumber(item.quantity)}
                                        </span>
                                    </div>
                                ))}
                                <div className="flex justify-between gap-3 bg-muted/50 px-3 py-2.5 font-semibold">
                                    <span>Total</span>
                                    <span className="tabular-nums">
                                        {formatNumber(assignment.quantity)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="flex-row items-center justify-between border-t">
                        <Button
                            variant="outline"
                            className="border-danger-border text-danger hover:bg-danger-soft hover:text-danger"
                            onClick={() => setConfirmingDelete(true)}
                        >
                            Delete
                        </Button>
                        <Button onClick={() => onEdit(assignment)}>
                            Edit order
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <DeleteDialog
                open={confirmingDelete}
                onOpenChange={setConfirmingDelete}
                title={`Delete order #${assignment.orderId}?`}
                description={`${assignment.customer} · ${formatNumber(assignment.quantity)} units. The plan will be recalculated without it.`}
                confirmLabel="Delete order"
                onConfirm={confirmDelete}
                processing={deleting}
            />
        </>
    );
}
