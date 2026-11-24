import { TriangleAlert } from 'lucide-react';

import { formatDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ScheduleAssignment, ScheduleMachine } from '@/types';

type Props = {
    machines: ScheduleMachine[];
    assignments: ScheduleAssignment[];
    lateCount: number;
    timezone: string;
};

function Kpi({
    label,
    sub,
    children,
    className,
}: {
    label: string;
    sub: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('rounded-[10px] border bg-card p-4', className)}>
            <div className="text-[13px] font-medium opacity-70">{label}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {children}
            </div>
            <div className="text-xs opacity-70">{sub}</div>
        </div>
    );
}

/** Three summary cards: orders planned, late orders, end of the plan. */
export default function PlanKpis({
    machines,
    assignments,
    lateCount,
    timezone,
}: Props) {
    const last = assignments.reduce<ScheduleAssignment | null>(
        (latest, assignment) =>
            latest === null || assignment.end > latest.end
                ? assignment
                : latest,
        null,
    );
    const lastMachine = machines.find(
        (machine) => machine.id === last?.machineId,
    );

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
            <Kpi
                label="Orders planned"
                sub={`on ${machines.length} ${machines.length === 1 ? 'machine' : 'machines'}`}
                className="text-foreground [&>div:first-child]:text-muted-foreground"
            >
                {assignments.length}
            </Kpi>
            <Kpi
                label="Late orders"
                sub={
                    lateCount > 0
                        ? 'after their need-by day'
                        : 'All orders on time'
                }
                className={
                    lateCount > 0
                        ? 'border-danger-border bg-danger-soft text-danger-soft-foreground'
                        : 'text-foreground'
                }
            >
                <span className="flex items-center gap-2">
                    {lateCount > 0 && (
                        <TriangleAlert className="size-6" aria-hidden />
                    )}
                    {lateCount}
                </span>
            </Kpi>
            <Kpi
                label="Plan ends"
                sub={
                    lastMachine
                        ? `last order on ${lastMachine.name}`
                        : 'No orders yet'
                }
                className="text-foreground"
            >
                {last ? (
                    <>
                        <span className="whitespace-nowrap">
                            {formatDate(last.end, timezone)},
                        </span>{' '}
                        <span className="whitespace-nowrap">
                            {formatTime(last.end, timezone)}
                        </span>
                    </>
                ) : (
                    '—'
                )}
            </Kpi>
        </div>
    );
}
