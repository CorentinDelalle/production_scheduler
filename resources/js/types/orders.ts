export type CustomerOption = {
    id: number;
    name: string;
};

export type ProductTypeOption = {
    id: number;
    name: string;
    unitsPerHour: number;
    changeoverMinutes: number;
    products: { id: number; name: string }[];
};

/** Options of the order form, sent by the plan and the orders page. */
export type OrderFormOptions = {
    customers: CustomerOption[];
    productTypes: ProductTypeOption[];
};

export type OrderItem = {
    productId: number;
    product: string;
    quantity: number;
};

/** An existing order as the form needs it (edit mode). */
export type EditableOrder = {
    id: number;
    customerId: number;
    productTypeId: number;
    needByDate: string;
    items: OrderItem[];
};

/** A row of the orders page. machine, end and isLate are null when there are no machines. */
export type OrderRow = EditableOrder & {
    customer: string;
    productType: string;
    quantity: number;
    machine: string | null;
    end: string | null;
    isLate: boolean | null;
};
