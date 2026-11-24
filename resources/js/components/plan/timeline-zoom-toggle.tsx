import type { TimelineZoom } from '@/components/plan/production-timeline';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type Props = {
    value: TimelineZoom;
    onChange: (value: TimelineZoom) => void;
};

/** Compact / detailed zoom switch for the timeline. */
export default function TimelineZoomToggle({ value, onChange }: Props) {
    return (
        <ToggleGroup
            type="single"
            value={value}
            onValueChange={(next) => {
                if (next) {
                    onChange(next as TimelineZoom);
                }
            }}
            aria-label="Zoom"
            className="rounded-lg bg-muted p-[3px]"
        >
            {(['compact', 'detailed'] as const).map((mode) => (
                <ToggleGroupItem
                    key={mode}
                    value={mode}
                    className="h-[30px] rounded-md px-3 text-[13px] text-muted-foreground capitalize first:rounded-md last:rounded-md hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-xs"
                >
                    {mode}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    );
}
