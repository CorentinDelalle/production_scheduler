<?php

namespace App\Concerns;

use App\Models\Customer;
use App\Models\Machine;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductType;
use App\Services\Assignment;
use App\Services\Scheduler;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;

/**
 * Order data shared by the plan and the orders page.
 */
trait PresentsOrders
{
    /**
     * All orders and machines, and the plan computed from the start date. Without a machine there is no plan.
     *
     * @return array{orders: Collection<int, Order>, machines: Collection<int, Machine>, assignments: list<Assignment>}
     */
    protected function plan(Scheduler $scheduler, CarbonImmutable $start): array
    {
        $orders = Order::with(['customer', 'productType', 'items.product'])
            ->orderBy('need_by_date')
            ->orderBy('id')
            ->get();
        $machines = Machine::orderBy('id')->get();

        return [
            'orders' => $orders,
            'machines' => $machines,
            'assignments' => $machines->isEmpty() ? [] : $scheduler->schedule($orders, $machines, $start),
        ];
    }

    /**
     * The order fields both pages show. `customer`, `productType` and `items.product` must be loaded.
     *
     * @return array{customerId: int, customer: string, productTypeId: int, productType: string, needByDate: string, quantity: int, items: array<int, array{productId: int, product: string, quantity: int}>}
     */
    protected function orderToArray(Order $order): array
    {
        return [
            'customerId' => $order->customer_id,
            'customer' => $order->customer->name,
            'productTypeId' => $order->product_type_id,
            'productType' => $order->productType->name,
            'needByDate' => $order->need_by_date->toDateString(),
            'quantity' => $order->totalQuantity(),
            'items' => $order->items
                ->map(fn (OrderItem $item) => [
                    'productId' => $item->product_id,
                    'product' => $item->product->name,
                    'quantity' => $item->quantity,
                ])->all(),
        ];
    }

    /**
     * Options of the order form, shared by the plan and the orders page.
     *
     * @return array{customers: array<int, array{id: int, name: string}>, productTypes: array<int, array{id: int, name: string, unitsPerHour: int, changeoverMinutes: int, products: array<int, array{id: int, name: string}>}>}
     */
    protected function orderFormOptions(): array
    {
        return [
            'customers' => Customer::orderBy('name')->get()
                ->map(fn (Customer $customer) => ['id' => $customer->id, 'name' => $customer->name])
                ->all(),
            'productTypes' => ProductType::with(['products' => fn ($query) => $query->orderBy('name')])
                ->orderBy('name')->get()
                ->map(fn (ProductType $type) => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'unitsPerHour' => $type->units_per_hour,
                    'changeoverMinutes' => $type->changeover_minutes,
                    'products' => $type->products
                        ->map(fn (Product $product) => ['id' => $product->id, 'name' => $product->name])
                        ->all(),
                ])->all(),
        ];
    }
}
