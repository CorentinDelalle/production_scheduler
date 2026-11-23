import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import ProductionTimeline from '@/components/production-timeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { typeColorClass } from '@/lib/timeline';
import { schedule } from '@/routes';
import type { ScheduleAssignment, ScheduleMachine } from '@/types';

type Props = {
    start: string;
    timezone: string;
    machines: ScheduleMachine[];
    assignments: ScheduleAssignment[];
};

export default function Schedule({
    start,
    timezone,
    machines,
    assignments,
}: Props) {
    const [startDate, setStartDate] = useState(start);

    const lateCount = assignments.filter(
        (assignment) => assignment.isLate,
    ).length;

    const productTypes = [
        ...new Map(
            assignments.map((assignment) => [
                assignment.productTypeId,
                assignment.productType,
            ]),
        ),
    ].sort(([a], [b]) => a - b);

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        router.get(
            schedule.url(),
            { start: startDate },
            { preserveState: true },
        );
    }

    return (
        <>
            <Head title="Schedule" />
            <div className="flex flex-col gap-4 p-4">
                <form
                    onSubmit={submit}
                    className="flex flex-wrap items-end gap-3"
                >
                    <div className="grid gap-2">
                        <Label htmlFor="start">Start date</Label>
                        <Input
                            id="start"
                            type="date"
                            value={startDate}
                            onChange={(event) =>
                                setStartDate(event.target.value)
                            }
                            required
                        />
                    </div>
                    <Button type="submit">Update</Button>
                    <p className="text-sm text-muted-foreground">
                        {lateCount === 0
                            ? 'No late orders'
                            : `${lateCount} late ${lateCount === 1 ? 'order' : 'orders'}`}
                    </p>
                </form>

                {machines.length === 0 ? (
                    <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        No machines configured.
                    </p>
                ) : assignments.length === 0 ? (
                    <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                        No orders to schedule yet.
                    </p>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground">
                            Times in {timezone}
                        </p>
                        <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                            <li className="flex items-center gap-2">
                                <span className="tl-swatch tl-changeover" />
                                Changeover
                            </li>
                            {productTypes.map(([id, name]) => (
                                <li
                                    key={id}
                                    className="flex items-center gap-2"
                                >
                                    <span
                                        className={`tl-swatch tl-production ${typeColorClass(id)}`}
                                    />
                                    {name}
                                </li>
                            ))}
                            <li className="flex items-center gap-2">
                                <span className="tl-swatch tl-production tl-late" />
                                Late
                            </li>
                        </ul>
                        <ProductionTimeline
                            machines={machines}
                            assignments={assignments}
                            start={start}
                            timezone={timezone}
                        />
                    </>
                )}
            </div>
        </>
    );
}

Schedule.layout = {
    breadcrumbs: [
        {
            title: 'Schedule',
            href: schedule(),
        },
    ],
};
