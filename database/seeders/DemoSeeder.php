<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Demo customers and orders, so the reviewer sees a schedule right away.
 * Not part of deployments: run it once with `php artisan db:seed --class=DemoSeeder`.
 */
class DemoSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Each order: customer, days from today to the need-by date, and quantity per product.
     * All products of an order share the same type.
     *
     * @var list<array{customer: string, need_by_in_days: int, items: array<string, int>}>
     */
    private const ORDERS = [
        ['customer' => 'Acme Packaging', 'need_by_in_days' => 1, 'items' => ['A' => 4000, 'B' => 3000]],
        ['customer' => 'Brightside Foods', 'need_by_in_days' => 1, 'items' => ['D' => 6000]],
        ['customer' => 'Evergreen Books', 'need_by_in_days' => 1, 'items' => ['B' => 15000]],
        ['customer' => 'Coastal Retail', 'need_by_in_days' => 2, 'items' => ['F' => 5000]],
        ['customer' => 'Delta Pharma', 'need_by_in_days' => 2, 'items' => ['C' => 9000]],
        ['customer' => 'Delta Pharma', 'need_by_in_days' => 2, 'items' => ['E' => 12000]],
        ['customer' => 'Acme Packaging', 'need_by_in_days' => 3, 'items' => ['D' => 3000, 'E' => 5000]],
        ['customer' => 'Brightside Foods', 'need_by_in_days' => 3, 'items' => ['A' => 6000]],
        ['customer' => 'Coastal Retail', 'need_by_in_days' => 4, 'items' => ['C' => 4000]],
        ['customer' => 'Evergreen Books', 'need_by_in_days' => 5, 'items' => ['C' => 7000]],
    ];

    /**
     * Seed the demo data, unless orders already exist.
     */
    public function run(): void
    {
        $this->call(ReferenceDataSeeder::class);

        if (Order::exists()) {
            $this->command?->warn('Orders already exist, demo data skipped.');

            return;
        }

        $products = Product::all()->keyBy('name');

        foreach (self::ORDERS as $demoOrder) {
            $orderProducts = collect($demoOrder['items'])->keys()->map(fn (string $name) => $products[$name]);

            $order = Order::create([
                'customer_id' => Customer::firstOrCreate(['name' => $demoOrder['customer']])->id,
                'product_type_id' => $orderProducts->first()->product_type_id,
                'need_by_date' => today()->addDays($demoOrder['need_by_in_days']),
            ]);

            foreach ($orderProducts as $product) {
                $order->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $demoOrder['items'][$product->name],
                ]);
            }
        }
    }
}
