import type { OrderItem } from './orders';

export type ScheduleMachine = {
    id: number;
    name: string;
};

export type ScheduleAssignment = {
    orderId: number;
    machineId: number;
    customerId: number;
    customer: string;
    productType: string;
    productTypeId: number;
    quantity: number;
    needByDate: string;
    changeoverStart: string;
    productionStart: string;
    end: string;
    isLate: boolean;
    items: OrderItem[];
};
