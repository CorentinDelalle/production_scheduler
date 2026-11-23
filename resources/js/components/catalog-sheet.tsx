import { Form } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import type { RouteFormDefinition } from '@/wayfinder';

type FormState = {
    errors: Partial<Record<string, string>>;
    processing: boolean;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    subtitle: string;
    form: RouteFormDefinition<'post'>;
    submitLabel: string;
    notice?: ReactNode;
    children: (state: FormState) => ReactNode;
};

/** Right-hand sheet holding a catalog form: fields, then Cancel and the submit button. Closes itself on success. */
export default function CatalogSheet({
    open,
    onOpenChange,
    title,
    subtitle,
    form,
    submitLabel,
    notice,
    children,
}: Props) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md">
                <Form
                    {...form}
                    options={{ preserveScroll: true }}
                    onSuccess={() => onOpenChange(false)}
                    resetOnSuccess
                    className="flex h-full min-h-0 flex-col"
                    noValidate
                >
                    {({ errors, processing }) => (
                        <>
                            <SheetHeader className="border-b">
                                <SheetTitle>{title}</SheetTitle>
                                <SheetDescription>{subtitle}</SheetDescription>
                            </SheetHeader>

                            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
                                {notice}
                                {children({ errors, processing })}
                            </div>

                            <div className="flex justify-end gap-2 border-t p-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {submitLabel}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </SheetContent>
        </Sheet>
    );
}
