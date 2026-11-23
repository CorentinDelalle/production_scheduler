import { typeColorClass } from '@/lib/timeline';
import { cn } from '@/lib/utils';

type Props = {
    productTypeId: number;
    className?: string;
};

/** Small square showing the palette colour of a product type. Decorative: the type name is shown next to it. */
export default function TypeSwatch({ productTypeId, className }: Props) {
    return (
        <span
            className={cn(
                'inline-block size-3 shrink-0 rounded-[3px] border-[1.5px]',
                typeColorClass(productTypeId),
                className,
            )}
            style={{
                background: 'var(--tl-fill)',
                borderColor: 'var(--tl-edge)',
            }}
            aria-hidden
        />
    );
}
