import { useEffect, useRef } from 'react';
import type { ScheduleAssignment, ScheduleMachine } from '@/types';
import * as vis from 'vis-timeline/standalone';
import type { TimelineOptions } from 'vis-timeline/standalone';
import {
    startOfDayInTimezone,
    timezoneOffsetMinutes,
    typeColorClass,
} from '@/lib/timeline';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import './production-timeline.css';

type Props = {
    machines: ScheduleMachine[];
    assignments: ScheduleAssignment[];
    start: string;
    timezone: string;
};

type TimelineItem = {
    id: string;
    group: number;
    start: Date;
    end: Date;
    type: 'range';
    className: string;
    content: string;
    title: string;
    editable: false;
};

/** vis-timeline renders strings as HTML: escape user data (customer names). */
function escapeHtml(text: string): string {
    return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function tooltip(assignment: ScheduleAssignment, timeZone: string): string {
    const format = (iso: string) =>
        new Date(iso).toLocaleString('en-CA', {
            timeZone,
            dateStyle: 'medium',
            timeStyle: 'short',
        });

    return [
        `Order #${assignment.orderId}`,
        assignment.customer,
        `${assignment.productType}, ${assignment.quantity} units`,
        `Need by: ${assignment.needByDate}`,
        `Start: ${format(assignment.productionStart)}`,
        `End: ${format(assignment.end)}`,
        ...(assignment.isLate ? ['LATE'] : []),
    ]
        .map(escapeHtml)
        .join('<br>');
}

function buildItems(
    assignments: ScheduleAssignment[],
    timeZone: string,
): TimelineItem[] {
    return assignments.flatMap((assignment) => {
        const items: TimelineItem[] = [];

        if (assignment.changeoverStart !== assignment.productionStart) {
            items.push({
                id: `changeover-${assignment.orderId}`,
                group: assignment.machineId,
                start: new Date(assignment.changeoverStart),
                end: new Date(assignment.productionStart),
                type: 'range',
                className: 'tl-changeover',
                content: '',
                title: `Changeover before order #${assignment.orderId}`,
                editable: false,
            });
        }

        items.push({
            id: `order-${assignment.orderId}`,
            group: assignment.machineId,
            start: new Date(assignment.productionStart),
            end: new Date(assignment.end),
            type: 'range',
            className: [
                'tl-production',
                typeColorClass(assignment.productTypeId),
                assignment.isLate ? 'tl-late' : '',
            ].join(' '),
            content: escapeHtml(assignment.customer),
            title: tooltip(assignment, timeZone),
            editable: false,
        });

        return items;
    });
}

export default function ProductionTimeline({
    machines,
    assignments,
    start,
    timezone,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const windowStart = startOfDayInTimezone(start, timezone);
        const lastEnd = assignments.reduce(
            (latest, assignment) =>
                Math.max(latest, new Date(assignment.end).getTime()),
            0,
        );
        const windowEnd =
            lastEnd > windowStart.getTime()
                ? new Date(lastEnd)
                : new Date(windowStart.getTime() + 24 * 3600 * 1000);

        // Display in the business timezone: moment() is vis-timeline's date constructor.
        // The standalone build exports it, but its typings do not declare it.
        const { moment } = vis as unknown as {
            moment: (date?: unknown) => {
                valueOf: () => number;
                utcOffset: (minutes: number) => unknown;
            };
        };
        const inTimezone = (date?: unknown) => {
            const value = moment(date);

            return value.utcOffset(
                timezoneOffsetMinutes(timezone, value.valueOf()),
            );
        };

        const timeline = new vis.Timeline(
            container,
            buildItems(assignments, timezone),
            machines.map((machine) => ({
                id: machine.id,
                content: machine.name,
            })),
            {
                start: windowStart,
                end: windowEnd,
                editable: false,
                stack: false,
                orientation: 'top',
                locale: 'en',
                zoomKey: 'ctrlKey',
                horizontalScroll: true,
                margin: { item: 4 },
                moment: inTimezone,
            } as unknown as TimelineOptions,
        );

        return () => timeline.destroy();
    }, [machines, assignments, start, timezone]);

    return <div ref={containerRef} className="production-timeline" />;
}
