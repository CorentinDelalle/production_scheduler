import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import EmptyState from '@/components/empty-state';
import OrderDetailSheet from '@/components/orders/order-detail-sheet';
import OrderFormSheet from '@/components/orders/order-form-sheet';
import PlanAgenda from '@/components/plan/plan-agenda';
import PlanKpis from '@/components/plan/plan-kpis';
import PlanLateBanner from '@/components/plan/plan-late-banner';
import ProductionTimeline from '@/components/plan/production-timeline';
import type { TimelineZoom } from '@/components/plan/production-timeline';
import TypeSwatch from '@/components/type-swatch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as machinesIndex } from '@/routes/machines';
import type {
    EditableOrder,
    OrderFormOptions,
    ScheduleAssignment,
    ScheduleMachine,
} from '@/types';

type Props = OrderFormOptions & {
    start: string;
    timezone: string;
    machines: ScheduleMachine[];
    assignments: ScheduleAssignment[];
};

export default function Dashboard({
    start,
    timezone,
    machines,
    assignments,
    customers,
    productTypes,
}: Props) {
    const isMobile = useIsMobile();
    const { flash } = usePage();
    const [startDate, setStartDate] = useState(start);
    const [zoom, setZoom] = useState<TimelineZoom>('compact');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [highlightId, setHighlightId] = useState<number | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<EditableOrder | null>(null);

    const flashedHighlight = flash?.highlight;

    useEffect(() => {
        if (flashedHighlight === undefined || flashedHighlight === null) {
            return;
        }

        setHighlightId(flashedHighlight);
        const timer = setTimeout(() => setHighlightId(null), 5000);

        return () => clearTimeout(timer);
    }, [flashedHighlight]);

    const lateCount = assignments.filter(
        (assignment) => assignment.isLate,
    ).length;
    const selected =
        assignments.find((assignment) => assignment.orderId === selectedId) ??
        null;
    const typesInPlan = [
        ...new Map(
            assignments.map((assignment) => [
                assignment.productTypeId,
                assignment.productType,
            ]),
        ),
    ].sort(([a], [b]) => a - b);

    function changeStart(value: string) {
        setStartDate(value);

        if (value) {
            router.get(
                dashboard.url(),
                { start: value },
                { preserveState: true },
            );
        }
    }

    function openNewOrder() {
        setEditing(null);
        setFormOpen(true);
    }

    function editOrder(assignment: ScheduleAssignment) {
        setEditing({
            id: assignment.orderId,
            customerId: assignment.customerId,
            productTypeId: assignment.productTypeId,
            needByDate: assignment.needByDate,
            items: assignment.items,
        });
        setSelectedId(null);
        setFormOpen(true);
    }

    const newOrderButton = (
        <Button onClick={openNewOrder}>
            <Plus aria-hidden />
            New order
        </Button>
    );

    return (
        <>
            <Head title="Production plan" />
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 p-4 md:gap-6 md:p-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="hidden md:block">
                        <h1 className="text-[26px] font-semibold tracking-tight">
                            Production plan
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Built automatically from your orders. Select a block
                            to see the order.
                        </p>
                    </div>
                    <div className="flex w-full flex-wrap items-end gap-3 md:w-auto">
                        <div className="grid flex-1 gap-1 md:flex-none">
                            <Label
                                htmlFor="start"
                                className="text-[13px] text-muted-foreground"
                            >
                                Plan starts on
                            </Label>
                            <Input
                                id="start"
                                type="date"
                                value={startDate}
                                onChange={(event) =>
                                    changeStart(event.target.value)
                                }
                                className="h-10 font-medium"
                            />
                        </div>
                        {newOrderButton}
                    </div>
                </div>

                <PlanKpis
                    machines={machines}
                    assignments={assignments}
                    lateCount={lateCount}
                    timezone={timezone}
                />

                <PlanLateBanner
                    assignments={assignments}
                    timezone={timezone}
                    onSelectOrder={setSelectedId}
                />

                {machines.length === 0 ? (
                    <EmptyState
                        title="No machines yet"
                        description="Add a machine so orders can be planned on it."
                        action={
                            <Button asChild>
                                <Link href={machinesIndex.url()}>
                                    Go to Machines
                                </Link>
                            </Button>
                        }
                    />
                ) : isMobile ? (
                    <PlanAgenda
                        machines={machines}
                        assignments={assignments}
                        timezone={timezone}
                        onSelectOrder={setSelectedId}
                    />
                ) : (
                    <section
                        aria-label="Timeline"
                        className="overflow-hidden rounded-xl border bg-card"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                            <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[13px] text-muted-foreground">
                                {typesInPlan.map(([id, name]) => (
                                    <li
                                        key={id}
                                        className="flex items-center gap-1.5"
                                    >
                                        <TypeSwatch
                                            productTypeId={id}
                                            className="size-3.5"
                                        />
                                        {name}
                                    </li>
                                ))}
                                <li className="flex items-center gap-1.5">
                                    <span className="tl-swatch tl-changeover size-3.5" />
                                    Changeover
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center gap-0.5 rounded-[4px] bg-danger px-1.5 text-[11px] font-bold text-danger-foreground">
                                        <TriangleAlert
                                            className="size-2.5"
                                            aria-hidden
                                        />
                                        LATE
                                    </span>
                                    Misses delivery
                                </li>
                            </ul>
                            <div
                                role="group"
                                aria-label="Zoom"
                                className="flex rounded-lg bg-muted p-[3px]"
                            >
                                {(['compact', 'detailed'] as const).map(
                                    (mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            aria-pressed={zoom === mode}
                                            onClick={() => setZoom(mode)}
                                            className={cn(
                                                'h-[30px] rounded-md px-3 text-[13px] font-medium capitalize',
                                                zoom === mode
                                                    ? 'bg-background shadow-xs'
                                                    : 'text-muted-foreground',
                                            )}
                                        >
                                            {mode}
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>
                        <div className="relative border-t">
                            <ProductionTimeline
                                machines={machines}
                                assignments={assignments}
                                start={start}
                                timezone={timezone}
                                zoom={zoom}
                                selectedOrderId={selectedId}
                                highlightOrderId={highlightId}
                                onSelectOrder={setSelectedId}
                            />
                            {assignments.length === 0 && (
                                <div className="absolute inset-x-0 top-11 bottom-0 z-10 flex items-center justify-center bg-card/85">
                                    <div className="flex max-w-[340px] flex-col items-center gap-2.5 text-center">
                                        <div className="text-[17px] font-semibold">
                                            Nothing to plan yet
                                        </div>
                                        <p className="text-muted-foreground">
                                            Add an order and it appears here on
                                            the first free machine, with
                                            changeovers included.
                                        </p>
                                        {newOrderButton}
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="border-t px-4 py-2 text-xs text-muted-foreground">
                            Times in {timezone}
                        </p>
                    </section>
                )}
            </div>

            <OrderDetailSheet
                assignment={selected}
                machines={machines}
                productTypes={productTypes}
                timezone={timezone}
                onClose={() => setSelectedId(null)}
                onEdit={editOrder}
            />

            <OrderFormSheet
                open={formOpen}
                onOpenChange={setFormOpen}
                order={editing}
                customers={customers}
                productTypes={productTypes}
            />
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Plan',
            href: dashboard(),
        },
    ],
};
