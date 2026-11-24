import { Plus, X } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatNumber } from '@/lib/format';

export type Line = { product_id: string; quantity: string };

export const emptyLine: Line = { product_id: '', quantity: '' };

type Props = {
    lines: Line[];
    products: { id: number; name: string }[];
    disabled: boolean;
    errors: Record<string, string | undefined>;
    onChange: (lines: Line[]) => void;
};

/** Product lines of an order: product, quantity, add and remove, with the total. */
export default function OrderLinesField({
    lines,
    products,
    disabled,
    errors,
    onChange,
}: Props) {
    const total = lines.reduce(
        (sum, line) => sum + (parseInt(line.quantity, 10) || 0),
        0,
    );

    function updateLine(index: number, patch: Partial<Line>) {
        onChange(
            lines.map((line, i) =>
                i === index ? { ...line, ...patch } : line,
            ),
        );
    }

    return (
        <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm leading-none font-medium">
                Products
            </legend>
            {lines.map((line, index) => {
                const productError = errors[`items.${index}.product_id`];
                const quantityError = errors[`items.${index}.quantity`];
                const usedElsewhere = new Set(
                    lines
                        .filter((_, i) => i !== index)
                        .map((l) => l.product_id),
                );
                const options = products.filter(
                    (product) => !usedElsewhere.has(String(product.id)),
                );

                return (
                    <div key={index} className="grid gap-1">
                        <div className="flex items-center gap-2">
                            <Select
                                value={line.product_id}
                                disabled={disabled}
                                onValueChange={(value) =>
                                    updateLine(index, { product_id: value })
                                }
                            >
                                <SelectTrigger
                                    className="min-w-0 flex-1"
                                    aria-label={`Product, line ${index + 1}`}
                                    aria-invalid={!!productError}
                                >
                                    <SelectValue
                                        placeholder={
                                            disabled
                                                ? 'Choose a type first'
                                                : 'Select a product'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.map((product) => (
                                        <SelectItem
                                            key={product.id}
                                            value={String(product.id)}
                                        >
                                            {product.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="relative w-32 shrink-0">
                                <Input
                                    type="number"
                                    min={1}
                                    max={1000000}
                                    step={1}
                                    inputMode="numeric"
                                    value={line.quantity}
                                    onChange={(event) =>
                                        updateLine(index, {
                                            quantity: event.target.value,
                                        })
                                    }
                                    aria-label={`Quantity, line ${index + 1}`}
                                    aria-invalid={!!quantityError}
                                    className="pr-12"
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                                    units
                                </span>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                    onChange(
                                        lines.filter((_, i) => i !== index),
                                    )
                                }
                                disabled={lines.length === 1}
                                aria-label={`Remove line ${index + 1}`}
                            >
                                <X />
                            </Button>
                        </div>
                        <InputError
                            id={`order-line-${index}-error`}
                            role="alert"
                            message={productError ?? quantityError}
                        />
                    </div>
                );
            })}
            <InputError
                id="order-items-error"
                role="alert"
                message={errors.items}
            />
            <Button
                type="button"
                variant="outline"
                className="border-dashed"
                disabled={disabled}
                onClick={() => onChange([...lines, { ...emptyLine }])}
            >
                <Plus />
                Add product line
            </Button>
            <p className="text-sm font-medium tabular-nums">
                Total: {formatNumber(total)} units
            </p>
        </fieldset>
    );
}
