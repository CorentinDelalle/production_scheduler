import { TriangleAlert } from 'lucide-react';

import { formatDuration } from '@/lib/format';
import { lateMinutes } from '@/lib/schedule';
import type { ScheduleAssignment } from '@/types';

type Props = {
    assignments: ScheduleAssignment[];
    timezone: string;
    onSelectOrder: (orderId: number) => void;
};

/** Banner listing the late orders, one button each opening the order detail. */
export default function PlanLateBanner({
    assignments,
    timezone,
    onSelectOrder,
}: Props) {
    const late = assignments.filter((assignment) => assignment.isLate);

    if (late.length === 0) {
        return null;
    }

    return (
        <div
            role="status"
            className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[10px] border border-danger-border bg-danger-soft px-4 py-3 text-danger-soft-foreground"
        >
            <TriangleAlert className="size-5 shrink-0" aria-hidden />
            <strong className="font-semibold">
                {late.length === 1
                    ? '1 late order'
                    : `${late.length} late orders`}
            </strong>
            {late.map((assignment) => (
                <button
                    key={assignment.orderId}
                    type="button"
                    onClick={() => onSelectOrder(assignment.orderId)}
                    className="rounded-full border border-danger-border bg-card px-2.5 py-0.5 text-[13px] font-medium whitespace-nowrap text-danger-soft-foreground hover:bg-danger-soft"
                >
                    <span className="font-mono">#{assignment.orderId}</span>{' '}
                    {assignment.customer} · late by{' '}
                    {formatDuration(
                        lateMinutes(
                            assignment.needByDate,
                            assignment.end,
                            timezone,
                        ),
                    )}
                </button>
            ))}
        </div>
    );
}
