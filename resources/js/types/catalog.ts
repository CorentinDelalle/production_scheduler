/** A row of the customers page. */
export type Customer = {
    id: number;
    name: string;
    ordersCount: number;
};

/** A row of the products page. */
export type Product = {
    id: number;
    name: string;
    productTypeId: number;
    productType: string;
    ordersCount: number;
};

/** A row of the machines page. */
export type Machine = {
    id: number;
    name: string;
};

/** A row of the product types page. */
export type ProductType = {
    id: number;
    name: string;
    unitsPerHour: number;
    changeoverMinutes: number;
    productsCount: number;
    ordersCount: number;
};
