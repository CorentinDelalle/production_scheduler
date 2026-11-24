const numberFormat = new Intl.NumberFormat('en-US');

/** 12500 -> "12,500". */
export function formatNumber(value: number): string {
    return numberFormat.format(value);
}

/** A 'Y-m-d' calendar date (no timezone involved) -> "Mon 23 Nov". */
export function formatDay(date: string): string {
    return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
        timeZone: 'UTC',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

/** An ISO instant shown in the schedule timezone -> "14:05". */
export function formatTime(iso: string, timeZone: string): string {
    return new Date(iso).toLocaleTimeString('en-GB', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** An ISO instant shown in the schedule timezone -> "Mon 23 Nov". */
export function formatDate(iso: string, timeZone: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
        timeZone,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

/** An ISO instant shown in the schedule timezone -> "Mon 23 Nov, 14:05". */
export function formatDateTime(iso: string, timeZone: string): string {
    return `${formatDate(iso, timeZone)}, ${formatTime(iso, timeZone)}`;
}

/** A duration in minutes -> "45 min", "2 h", "2 h 05". */
export function formatDuration(minutes: number): string {
    const rounded = Math.round(minutes);

    if (rounded < 60) {
        return `${rounded} min`;
    }

    const hours = Math.floor(rounded / 60);
    const rest = rounded % 60;

    return rest === 0
        ? `${hours} h`
        : `${hours} h ${String(rest).padStart(2, '0')}`;
}

/** Minutes between two ISO instants. */
export function minutesBetween(startIso: string, endIso: string): number {
    return (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000;
}
