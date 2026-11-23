import { useEffect, useRef } from 'react';
import type { ScheduleAssignment, ScheduleMachine } from '@/types';
import * as vis from 'vis-timeline/standalone';
import type { TimelineOptions } from 'vis-timeline/standalone';
import { formatDateTime, formatNumber, minutesBetween } from '@/lib/format';
import {
    formatWeekdayTime,
    needByDeadline,
    startOfDayInTimezone,
    timezoneOffsetMinutes,
    typeColorClass,
} from '@/lib/timeline';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import './production-timeline.css';

export type TimelineZoom = 'compact' | 'detailed';

type Props = {
    machines: ScheduleMachine[];
    assignments: ScheduleAssignment[];
    start: string;
    timezone: string;
    zoom: TimelineZoom;
    /** The order whose detail is open: shown selected, with its due marker. */
    selectedOrderId: number | null;
    /** An order just saved: shown selected and scrolled into view, without a marker. */
    highlightOrderId: number | null;
    onSelectOrder: (orderId: number) => void;
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
    selectable: boolean;
};

const WARNING_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>';

/** Tags and attributes the item and group templates need through vis-timeline's XSS filter. */
const TEMPLATE_TAGS = {
    div: ['class'],
    span: ['class'],
    svg: [
        'xmlns',
        'width',
        'height',
        'viewBox',
        'fill',
        'stroke',
        'stroke-width',
        'stroke-linecap',
        'stroke-linejoin',
        'aria-hidden',
    ],
    path: ['d'],
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

function itemTitle(assignment: ScheduleAssignment, timeZone: string): string {
    return [
        `Order #${assignment.orderId}`,
        assignment.customer,
        `${assignment.productType}, ${formatNumber(assignment.quantity)} units`,
        `${formatDateTime(assignment.productionStart, timeZone)} to ${formatDateTime(assignment.end, timeZone)}`,
        assignment.isLate ? 'LATE' : 'On time',
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
            const minutes = Math.round(
                minutesBetween(
                    assignment.changeoverStart,
                    assignment.productionStart,
                ),
            );

            items.push({
                id: `changeover-${assignment.orderId}`,
                group: assignment.machineId,
                start: new Date(assignment.changeoverStart),
                end: new Date(assignment.productionStart),
                type: 'range',
                className: 'tl-changeover',
                content: '',
                title: escapeHtml(
                    `Changeover ${minutes} min to ${assignment.productType}`,
                ),
                editable: false,
                selectable: false,
            });
        }

        const badge = assignment.isLate
            ? `<span class="tl-late-badge">${WARNING_ICON}LATE</span>`
            : '';

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
            content:
                `<div class="tl-job"><div class="tl-job-head"><span class="tl-job-id">#${assignment.orderId}</span>${badge}</div>` +
                `<div class="tl-job-line tl-job-customer">${escapeHtml(assignment.customer)}</div>` +
                `<div class="tl-job-line tl-job-meta">${escapeHtml(assignment.productType)} · ${formatNumber(assignment.quantity)}</div></div>`,
            title: itemTitle(assignment, timeZone),
            editable: false,
            selectable: true,
        });

        return items;
    });
}

function buildGroups(
    machines: ScheduleMachine[],
    assignments: ScheduleAssignment[],
    timeZone: string,
) {
    return machines.map((machine) => {
        const own = assignments.filter(
            (assignment) => assignment.machineId === machine.id,
        );
        const free = own.reduce<string | null>(
            (latest, assignment) =>
                latest === null || assignment.end > latest
                    ? assignment.end
                    : latest,
            null,
        );
        const sub =
            free === null
                ? 'No orders'
                : `${own.length} ${own.length === 1 ? 'order' : 'orders'} · free ${formatWeekdayTime(free, timeZone)}`;

        return {
            id: machine.id,
            content: `<div class="tl-group"><div class="tl-group-name">${escapeHtml(machine.name)}</div><div class="tl-group-sub">${escapeHtml(sub)}</div></div>`,
        };
    });
}

export default function ProductionTimeline({
    machines,
    assignments,
    start,
    timezone,
    zoom,
    selectedOrderId,
    highlightOrderId,
    onSelectOrder,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const timelineRef = useRef<vis.Timeline | null>(null);
    const zoomRef = useRef(zoom);
    const onSelectRef = useRef(onSelectOrder);

    zoomRef.current = zoom;
    onSelectRef.current = onSelectOrder;

    /** The visible window: the whole plan (compact) or 24 hours from the plan start (detailed). */
    function applyWindow(timeline: vis.Timeline, mode: TimelineZoom) {
        const windowStart = startOfDayInTimezone(start, timezone);
        const lastEnd = assignments.reduce(
            (latest, assignment) =>
                Math.max(latest, new Date(assignment.end).getTime()),
            0,
        );
        const day = 24 * 3600 * 1000;
        const fullEnd =
            lastEnd > windowStart.getTime()
                ? lastEnd + (lastEnd - windowStart.getTime()) * 0.02
                : windowStart.getTime() + 3 * day;

        timeline.setWindow(
            windowStart,
            mode === 'detailed'
                ? new Date(windowStart.getTime() + day)
                : new Date(fullEnd),
            { animation: false },
        );
    }

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

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
            buildGroups(machines, assignments, timezone),
            {
                editable: false,
                stack: false,
                orientation: 'top',
                locale: 'en',
                zoomKey: 'ctrlKey',
                horizontalScroll: true,
                zoomMin: 30 * 60 * 1000,
                showCurrentTime: false,
                selectable: true,
                margin: { item: { horizontal: 0, vertical: 12 }, axis: 0 },
                format: {
                    minorLabels: {
                        hour: 'HH:mm',
                        minute: 'HH:mm',
                        weekday: 'ddd D',
                        day: 'D',
                    },
                    majorLabels: {
                        minute: 'ddd D MMM',
                        hour: 'ddd D MMM',
                        weekday: 'MMM YYYY',
                        day: 'MMM YYYY',
                    },
                },
                moment: inTimezone,
                // vis-timeline sanitises item and group HTML. Keep the filter, but allow
                // the classes and the icon our templates use (user data is escaped anyway).
                xss: {
                    disabled: false,
                    filterOptions: { whiteList: TEMPLATE_TAGS },
                },
            } as unknown as TimelineOptions,
        );

        timeline.on(
            'click',
            (properties: { item?: string | number | null }) => {
                const match = /^order-(\d+)$/.exec(`${properties.item ?? ''}`);

                if (match) {
                    onSelectRef.current(Number(match[1]));
                }
            },
        );

        timelineRef.current = timeline;
        applyWindow(timeline, zoomRef.current);

        return () => {
            timeline.destroy();
            timelineRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [machines, assignments, start, timezone]);

    useEffect(() => {
        if (timelineRef.current) {
            applyWindow(timelineRef.current, zoom);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [zoom]);

    // Selection ring and due marker. Runs after the effect that (re)creates the timeline.
    useEffect(() => {
        const timeline = timelineRef.current;

        if (!timeline) {
            return;
        }

        const focusedId = selectedOrderId ?? highlightOrderId;
        timeline.setSelection(focusedId === null ? [] : [`order-${focusedId}`]);

        const assignment = assignments.find(
            (candidate) => candidate.orderId === selectedOrderId,
        );

        if (assignment) {
            const due = needByDeadline(assignment.needByDate, timezone);
            const label = `Due #${assignment.orderId}`;

            timeline.addCustomTime(due, 'tl-due');
            timeline.setCustomTimeTitle(label, 'tl-due');
            const bar = containerRef.current?.querySelector<HTMLElement>(
                '.vis-custom-time.tl-due',
            );

            if (bar) {
                bar.dataset.label = label;
            }
        } else if (selectedOrderId === null && highlightOrderId !== null) {
            timeline.focus(`order-${highlightOrderId}`, {
                animation: false,
                zoom: false,
            });
        }

        return () => {
            try {
                timeline.removeCustomTime('tl-due');
            } catch {
                // No marker was added.
            }
        };
    }, [
        machines,
        assignments,
        start,
        timezone,
        selectedOrderId,
        highlightOrderId,
    ]);

    return <div ref={containerRef} className="production-timeline" />;
}
