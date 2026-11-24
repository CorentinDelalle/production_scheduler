import { useForm } from '@inertiajs/react';
import { Check, CircleAlert, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import TypeSwatch from '@/components/type-swatch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { store, update } from '@/actions/App/Http/Controllers/OrderController';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { CustomerOption, EditableOrder, ProductTypeOption } from '@/types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order?: EditableOrder | null;
    customers: CustomerOption[];
    productTypes: ProductTypeOption[];
};

type Line = { product_id: string; quantity: string };

type FormData = {
    customer_id: string;
    product_type_id: string;
    need_by_date: string;
    items: Line[];
};

const emptyLine: Line = { product_id: '', quantity: '' };

function initialData(order?: EditableOrder | null): FormData {
    if (!order) {
        return {
            customer_id: '',
            product_type_id: '',
            need_by_date: '',
            items: [{ ...emptyLine }],
        };
    }

    return {
        customer_id: String(order.customerId),
        product_type_id: String(order.productTypeId),
        need_by_date: order.needByDate,
        items: order.items.map((item) => ({
            product_id: String(item.productId),
            quantity: String(item.quantity),
        })),
    };
}

function FieldError({ id, message }: { id: string; message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p id={id} role="alert" className="text-sm text-destructive">
            {message}
        </p>
    );
}

export default function OrderFormSheet({
    open,
    onOpenChange,
    order,
    customers,
    productTypes,
}: Props) {
    const form = useForm<FormData>(initialData(order));
    const { data, setData, errors, processing } = form;
    const [typeChangeNote, setTypeChangeNote] = useState(false);
    const fieldErrors = errors as Record<string, string | undefined>;

    // Start from a clean form whenever the sheet opens or targets another order.
    useEffect(() => {
        if (open) {
            form.setData(initialData(order));
            form.clearErrors();
            setTypeChangeNote(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, order]);

    const selectedType = productTypes.find(
        (type) => String(type.id) === data.product_type_id,
    );
    const total = data.items.reduce(
        (sum, line) => sum + (parseInt(line.quantity, 10) || 0),
        0,
    );
    const hasErrors = Object.keys(errors).length > 0;

    function selectType(type: ProductTypeOption) {
        if (String(type.id) === data.product_type_id) {
            return;
        }

        const allowed = new Set(type.products.map((p) => String(p.id)));
        const kept = data.items.filter(
            (line) => line.product_id === '' || allowed.has(line.product_id),
        );
        const removed = kept.length !== data.items.length;
        const hadProducts = data.items.some((line) => line.product_id !== '');

        setData({
            ...data,
            product_type_id: String(type.id),
            items: kept.length > 0 ? kept : [{ ...emptyLine }],
        });
        setTypeChangeNote(removed && hadProducts);
    }

    function updateLine(index: number, patch: Partial<Line>) {
        setData(
            'items',
            data.items.map((line, i) =>
                i === index ? { ...line, ...patch } : line,
            ),
        );
    }

    function removeLine(index: number) {
        setData(
            'items',
            data.items.filter((_, i) => i !== index),
        );
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.transform((current) => ({
            customer_id: current.customer_id,
            product_type_id: current.product_type_id,
            need_by_date: current.need_by_date,
            items: current.items.map((line) => ({
                product_id: line.product_id,
                quantity: line.quantity,
            })),
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            },
        };

        if (order) {
            form.submit(update(order.id), options);
        } else {
            form.submit(store(), options);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full gap-0 p-0 sm:max-w-[520px]"
            >
                <form
                    onSubmit={submit}
                    noValidate
                    className="flex h-full min-h-0 flex-col"
                >
                    <SheetHeader className="border-b p-5 pr-12 text-left">
                        <SheetTitle className="text-xl">
                            {order ? `Edit order #${order.id}` : 'New order'}
                        </SheetTitle>
                        <SheetDescription>
                            {order
                                ? 'Saving recalculates the plan.'
                                : 'The plan updates as soon as you save.'}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
                        {hasErrors && (
                            <div
                                role="alert"
                                className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                            >
                                <CircleAlert className="size-4 shrink-0" />
                                Fix the highlighted fields to save the order.
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="order-customer">Customer</Label>
                            <Select
                                value={data.customer_id}
                                onValueChange={(value) =>
                                    setData('customer_id', value)
                                }
                            >
                                <SelectTrigger
                                    id="order-customer"
                                    className="w-full"
                                    aria-invalid={!!errors.customer_id}
                                    aria-describedby={
                                        errors.customer_id
                                            ? 'order-customer-error'
                                            : undefined
                                    }
                                >
                                    <SelectValue placeholder="Select a customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((customer) => (
                                        <SelectItem
                                            key={customer.id}
                                            value={String(customer.id)}
                                        >
                                            {customer.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError
                                id="order-customer-error"
                                message={errors.customer_id}
                            />
                        </div>

                        <div className="grid gap-2">
                            <span
                                id="order-type-label"
                                className="text-sm leading-none font-medium"
                            >
                                Product type
                            </span>
                            <div
                                role="radiogroup"
                                aria-labelledby="order-type-label"
                                aria-invalid={!!errors.product_type_id}
                                className="grid grid-cols-2 gap-2"
                            >
                                {productTypes.map((type) => {
                                    const selected =
                                        String(type.id) ===
                                        data.product_type_id;

                                    return (
                                        <button
                                            key={type.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={selected}
                                            onClick={() => selectType(type)}
                                            className={cn(
                                                'relative flex flex-col items-start gap-1 rounded-lg border-2 bg-card p-3 text-left transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                                                selected
                                                    ? 'border-primary bg-primary/5 hover:bg-primary/10'
                                                    : 'border-input',
                                            )}
                                        >
                                            <span className="flex items-center gap-2 font-medium">
                                                <TypeSwatch
                                                    productTypeId={type.id}
                                                />
                                                {type.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatNumber(
                                                    type.unitsPerHour,
                                                )}{' '}
                                                units/h
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
                            <FieldError
                                id="order-type-error"
                                message={errors.product_type_id}
                            />
                            {typeChangeNote && (
                                <p className="rounded-md bg-warning-soft px-3 py-2 text-xs text-warning-soft-foreground">
                                    Products of another type were removed.
                                </p>
                            )}
                        </div>

                        <fieldset className="grid gap-2">
                            <legend className="mb-2 text-sm leading-none font-medium">
                                Products
                            </legend>
                            {data.items.map((line, index) => {
                                const productError =
                                    fieldErrors[`items.${index}.product_id`];
                                const quantityError =
                                    fieldErrors[`items.${index}.quantity`];
                                const usedElsewhere = new Set(
                                    data.items
                                        .filter((_, i) => i !== index)
                                        .map((l) => l.product_id),
                                );
                                const options = (
                                    selectedType?.products ?? []
                                ).filter(
                                    (product) =>
                                        !usedElsewhere.has(String(product.id)),
                                );

                                return (
                                    <div key={index} className="grid gap-1">
                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={line.product_id}
                                                disabled={!selectedType}
                                                onValueChange={(value) =>
                                                    updateLine(index, {
                                                        product_id: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger
                                                    className="min-w-0 flex-1"
                                                    aria-label={`Product, line ${index + 1}`}
                                                    aria-invalid={
                                                        !!productError
                                                    }
                                                >
                                                    <SelectValue
                                                        placeholder={
                                                            selectedType
                                                                ? 'Select a product'
                                                                : 'Choose a type first'
                                                        }
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.map((product) => (
                                                        <SelectItem
                                                            key={product.id}
                                                            value={String(
                                                                product.id,
                                                            )}
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
                                                    step={1}
                                                    inputMode="numeric"
                                                    value={line.quantity}
                                                    onChange={(event) =>
                                                        updateLine(index, {
                                                            quantity:
                                                                event.target
                                                                    .value,
                                                        })
                                                    }
                                                    aria-label={`Quantity, line ${index + 1}`}
                                                    aria-invalid={
                                                        !!quantityError
                                                    }
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
                                                    removeLine(index)
                                                }
                                                disabled={
                                                    data.items.length === 1
                                                }
                                                aria-label={`Remove line ${index + 1}`}
                                            >
                                                <X />
                                            </Button>
                                        </div>
                                        <FieldError
                                            id={`order-line-${index}-error`}
                                            message={
                                                productError ?? quantityError
                                            }
                                        />
                                    </div>
                                );
                            })}
                            <FieldError
                                id="order-items-error"
                                message={errors.items}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="border-dashed"
                                disabled={!selectedType}
                                onClick={() =>
                                    setData('items', [
                                        ...data.items,
                                        { ...emptyLine },
                                    ])
                                }
                            >
                                <Plus />
                                Add product line
                            </Button>
                            <p className="text-sm font-medium tabular-nums">
                                Total: {formatNumber(total)} units
                            </p>
                        </fieldset>

                        <div className="grid gap-2">
                            <Label htmlFor="order-need-by">Need-by date</Label>
                            <Input
                                id="order-need-by"
                                type="date"
                                value={data.need_by_date}
                                onChange={(event) =>
                                    setData('need_by_date', event.target.value)
                                }
                                aria-invalid={!!errors.need_by_date}
                                aria-describedby={
                                    errors.need_by_date
                                        ? 'order-need-by-error'
                                        : 'order-need-by-help'
                                }
                            />
                            <p
                                id="order-need-by-help"
                                className="text-xs text-muted-foreground"
                            >
                                Due by the end of this day.
                            </p>
                            <FieldError
                                id="order-need-by-error"
                                message={errors.need_by_date}
                            />
                        </div>
                    </div>

                    <SheetFooter className="flex-row justify-end gap-2 border-t bg-background p-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {order ? 'Save changes' : 'Add order'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
