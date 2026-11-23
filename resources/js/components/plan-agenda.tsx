import { useState } from 'react';

import StatusBadge from '@/components/status-badge';
import {
    formatDay,
    formatDuration,
    formatNumber,
    formatTime,
    minutesBetween,
} from '@/lib/format';
import { lateMinutes, typeColorClass } from '@/lib/timeline';
import { cn } from '@/lib/utils';
import type { ScheduleAssignment, ScheduleMachine } from '@/types';

type Props = {
    machines: ScheduleMachine[];
    assignments: ScheduleAssignment[];
    timezone: string;
    onSelectOrder: (orderId: number) => void;
};

function dayOf(iso: string, timezone: string): string {
    return new Date(iso).toLocaleDateString('en-CA', { timeZone: timezone });
}

/** "Mon 23 Nov, 08:00 → 14:05", with the end time only when it is the same day. */
function formatRange(
    startIso: string,
    endIso: string,
    timezone: string,
): string {
    const startDay = dayOf(startIso, timezone);
    const from = `${formatDay(startDay)}, ${formatTime(startIso, timezone)}`;
    const to =
        dayOf(endIso, timezone) === startDay
            ? formatTime(endIso, timezone)
            : `${formatDay(dayOf(endIso, timezone))}, ${formatTime(endIso, timezone)}`;

    return `${from} → ${to}`;
}

/** Mobile alternative to the timeline: the sequence of one machine at a time. */
export default function PlanAgenda({
    machines,
    assignments,
    timezone,
    onSelectOrder,
}: Props) {
    const [machineId, setMachineId] = useState(machines[0]?.id);
    const current =
        machines.find((machine) => machine.id === machineId) ?? machines[0];
    const sequence = assignments
        .filter((assignment) => assignment.machineId === current?.id)
        .sort((a, b) => a.changeoverStart.localeCompare(b.changeoverStart));

    return (
        <section aria-label="Plan by machine" className="flex flex-col gap-3">
            <div
                role="tablist"
                aria-label="Machine"
                className="flex [scrollbar-width:none] gap-1.5 overflow-x-auto"
            >
                {machines.map((machine) => {
                    const count = assignments.filter(
                        (assignment) => assignment.machineId === machine.id,
                    ).length;
                    const active = machine.id === current?.id;

                    return (
                        <button
                            key={machine.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setMachineId(machine.id)}
                            className={cn(
                                'h-10 shrink-0 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap',
                                active
                                    ? 'border-foreground bg-foreground text-background'
                                    : 'bg-card text-foreground',
                            )}
                        >
                            {machine.name} ({count})
                        </button>
                    );
                })}
            </div>

            <div className="overflow-hidden rounded-xl border bg-card">
                {sequence.length === 0 && (
                    <p className="px-4 py-7 text-center text-muted-foreground">
                        No orders on this machine.
                    </p>
                )}
                {sequence.map((assignment) => {
                    const changeover =
                        assignment.changeoverStart !==
                        assignment.productionStart
                            ? Math.round(
                                  minutesBetween(
                                      assignment.changeoverStart,
                                      assignment.productionStart,
                                  ),
                              )
                            : 0;

                    return (
                        <div key={assignment.orderId}>
                            {changeover > 0 && (
                                <div className="flex items-center gap-2 border-b bg-[repeating-linear-gradient(135deg,#eceef1_0_2px,#f8f8fa_2px_6px)] px-3.5 py-1.5 text-xs text-[#3d424f] dark:bg-muted dark:text-muted-foreground">
                                    Changeover {changeover} min · to{' '}
                                    {assignment.productType}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() =>
                                    onSelectOrder(assignment.orderId)
                                }
                                className="flex w-full items-stretch gap-3 border-b px-3.5 py-3 text-left last:border-b-0"
                            >
                                <span
                                    className={cn(
                                        'w-1.5 shrink-0 rounded-[3px]',
                                        typeColorClass(
                                            assignment.productTypeId,
                                        ),
                                    )}
                                    style={{ background: 'var(--tl-edge)' }}
                                    aria-hidden
                                />
                                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <span className="flex items-center gap-1.5">
                                        <span className="font-mono text-[13px] font-semibold">
                                            #{assignment.orderId}
                                        </span>
                                        <span className="truncate font-semibold">
                                            {assignment.customer}
                                        </span>
                                    </span>
                                    <span className="text-[13px]">
                                        {assignment.productType} ·{' '}
                                        {formatNumber(assignment.quantity)}{' '}
                                        units
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatRange(
                                            assignment.productionStart,
                                            assignment.end,
                                            timezone,
                                        )}
                                    </span>
                                </span>
                                {assignment.isLate && (
                                    <StatusBadge
                                        late
                                        label={`Late ${formatDuration(lateMinutes(assignment.needByDate, assignment.end, timezone))}`}
                                        className="self-center"
                                    />
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
