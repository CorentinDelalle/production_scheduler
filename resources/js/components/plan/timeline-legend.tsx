import { TriangleAlert } from 'lucide-react';
import TypeSwatch from '@/components/type-swatch';

type Props = {
    types: { id: number; name: string }[];
};

/** Colour key for the timeline: product types, changeover and late. */
export default function TimelineLegend({ types }: Props) {
    return (
        <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[13px] text-muted-foreground">
            {types.map(({ id, name }) => (
                <li key={id} className="flex items-center gap-1.5">
                    <TypeSwatch productTypeId={id} className="size-3.5" />
                    {name}
                </li>
            ))}
            <li className="flex items-center gap-1.5">
                <span className="tl-swatch tl-changeover size-3.5" />
                Changeover
            </li>
            <li className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-0.5 rounded-[4px] bg-danger px-1.5 text-[11px] font-bold text-danger-foreground">
                    <TriangleAlert className="size-2.5" aria-hidden />
                    LATE
                </span>
                Misses delivery
            </li>
        </ul>
    );
}
