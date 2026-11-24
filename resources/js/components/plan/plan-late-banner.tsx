import { TriangleAlert } from 'lucide-react';

import { formatDuration } from '@/lib/format';
import { lateMinutes } from '@/lib/timeline';
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
            className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[10px] border border-[#f1b8b2] bg-[#fdecea] px-4 py-3 text-[#7a1610] dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
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
                    className="rounded-full border border-[#e79a92] bg-white px-2.5 py-0.5 text-[13px] font-medium whitespace-nowrap text-[#7a1610] hover:bg-[#fff5f4] dark:border-red-800 dark:bg-transparent dark:text-red-200 dark:hover:bg-red-950"
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
