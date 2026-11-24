import { useForm } from '@inertiajs/react';
import { CircleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import OrderLinesField, {
    emptyLine,
} from '@/components/orders/order-lines-field';
import type { Line } from '@/components/orders/order-lines-field';
import OrderTypePicker from '@/components/orders/order-type-picker';
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
import type { CustomerOption, EditableOrder, ProductTypeOption } from '@/types';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order?: EditableOrder | null;
    customers: CustomerOption[];
    productTypes: ProductTypeOption[];
};

type FormData = {
    customer_id: string;
    product_type_id: string;
    need_by_date: string;
    items: Line[];
};

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

    // Start from a clean form when the sheet opens or targets another order. Keyed on the id:
    // reloaded props (e.g. after a validation error) must not wipe what the user typed.
    useEffect(() => {
        if (open) {
            form.setData(initialData(order));
            form.clearErrors();
            setTypeChangeNote(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, order?.id]);

    const selectedType = productTypes.find(
        (type) => String(type.id) === data.product_type_id,
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

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
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
                            <InputError
                                id="order-customer-error"
                                role="alert"
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
                            <OrderTypePicker
                                productTypes={productTypes}
                                value={data.product_type_id}
                                onSelect={selectType}
                                invalid={!!errors.product_type_id}
                                labelledBy="order-type-label"
                            />
                            <InputError
                                id="order-type-error"
                                role="alert"
                                message={errors.product_type_id}
                            />
                            {typeChangeNote && (
                                <p className="rounded-md bg-warning-soft px-3 py-2 text-xs text-warning-soft-foreground">
                                    Products of another type were removed.
                                </p>
                            )}
                        </div>

                        <OrderLinesField
                            lines={data.items}
                            products={selectedType?.products ?? []}
                            disabled={!selectedType}
                            errors={fieldErrors}
                            onChange={(items) => setData('items', items)}
                        />

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
                            <InputError
                                id="order-need-by-error"
                                role="alert"
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
