export const TIMELINE_TYPE_COUNT = 6;

/** CSS class of the fixed palette color for a product type (see production-timeline.css). */
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
