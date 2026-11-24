<?php

namespace App\Concerns;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductType;

/**
 * Order data shared by the plan and the orders page.
 */
trait PresentsOrders
{
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

    /**
     * The lines of an order. `items.product` must be loaded.
     *
     * @return array<int, array{productId: int, product: string, quantity: int}>
     */
    protected function orderItemsToArray(Order $order): array
    {
        return $order->items
            ->map(fn (OrderItem $item) => [
                'productId' => $item->product_id,
                'product' => $item->product->name,
                'quantity' => $item->quantity,
            ])->all();
    }
}
