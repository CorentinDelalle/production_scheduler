import { Check } from 'lucide-react';
import TypeSwatch from '@/components/type-swatch';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ProductTypeOption } from '@/types';

type Props = {
    productTypes: ProductTypeOption[];
    value: string;
    onSelect: (type: ProductTypeOption) => void;
    invalid: boolean;
    labelledBy: string;
};

/** Radio cards to pick the product type of an order. */
export default function OrderTypePicker({
    productTypes,
    value,
    onSelect,
    invalid,
    labelledBy,
}: Props) {
    return (
        <div
            role="radiogroup"
            aria-labelledby={labelledBy}
            aria-invalid={invalid}
            className="grid grid-cols-2 gap-2"
        >
            {productTypes.map((type) => {
                const selected = String(type.id) === value;

                return (
                    <button
                        key={type.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onSelect(type)}
                        className={cn(
                            'relative flex flex-col items-start gap-1 rounded-lg border-2 bg-card p-3 text-left transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                            selected
                                ? 'border-primary bg-primary/5 hover:bg-primary/10'
                                : 'border-input',
                        )}
                    >
                        <span className="flex items-center gap-2 font-medium">
                            <TypeSwatch productTypeId={type.id} />
                            {type.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {formatNumber(type.unitsPerHour)} units/h
                        </span>
                        {selected && (
                            <Check
                                className="absolute top-2 right-2 size-4 text-primary"
                                aria-hidden
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
