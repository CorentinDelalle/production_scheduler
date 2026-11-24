export const TIMELINE_TYPE_COUNT = 6;

/** CSS class of the fixed palette color for a product type (see components/plan/production-timeline.css). */
export function typeColorClass(productTypeId: number): string {
    return `tl-type-${productTypeId % TIMELINE_TYPE_COUNT}`;
}

/** Offset of an IANA timezone from UTC at a given instant, in minutes (DST aware). */
export function timezoneOffsetMinutes(
    timeZone: string,
    instant: number,
): number {
    const label =
        new Intl.DateTimeFormat('en-US', {
            timeZone,
            timeZoneName: 'longOffset',
        })
            .formatToParts(new Date(instant))
            .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
    const match = /GMT([+-])(\d{2}):(\d{2})/.exec(label);

    if (!match) {
        return 0;
    }

    const minutes = Number(match[2]) * 60 + Number(match[3]);

    return match[1] === '-' ? -minutes : minutes;
}

/** The instant of midnight (00:00) of a 'Y-m-d' date in an IANA timezone. */
export function startOfDayInTimezone(date: string, timeZone: string): Date {
    const utcMidnight = new Date(`${date}T00:00:00Z`).getTime();
    const guess =
        utcMidnight - timezoneOffsetMinutes(timeZone, utcMidnight) * 60000;

    return new Date(
        utcMidnight - timezoneOffsetMinutes(timeZone, guess) * 60000,
    );
}

/** The deadline of an order: the end of its need-by day, i.e. midnight starting the next day in the timezone. */
export function needByDeadline(needByDate: string, timeZone: string): Date {
    const nextDay = new Date(`${needByDate}T00:00:00Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    return startOfDayInTimezone(nextDay.toISOString().slice(0, 10), timeZone);
}

/** Minutes an order finishes after its deadline (0 when on time). */
export function lateMinutes(
    needByDate: string,
    endIso: string,
    timeZone: string,
): number {
    return Math.max(
        0,
        (new Date(endIso).getTime() -
            needByDeadline(needByDate, timeZone).getTime()) /
            60000,
    );
}

/** An ISO instant in the timezone -> "Mon 08:00". */
export function formatWeekdayTime(iso: string, timeZone: string): string {
    const day = new Date(iso).toLocaleDateString('en-GB', {
        timeZone,
        weekday: 'short',
    });
    const time = new Date(iso).toLocaleTimeString('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
    });

    return `${day} ${time}`;
}
