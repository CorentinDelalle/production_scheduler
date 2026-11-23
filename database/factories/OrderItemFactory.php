<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    /**
     * Define the model's default state. The product always matches the order's product type.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'product_id' => fn (array $attributes) => Product::factory()->state([
                'product_type_id' => Order::whereKey($attributes['order_id'])->value('product_type_id'),
            ]),
            'quantity' => fake()->numberBetween(500, 10000),
        ];
    }
}
