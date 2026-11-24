<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Carbon\CarbonImmutable;
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
     * Need-by dates start six days out, so no order falls due during the review window
     * (up to five days after seeding). The large Tall Pines Brewing run takes over seven days
     * on its own, so the plan shows exactly one late order on each of those days.
     *
     * @var list<array{customer: string, need_by_in_days: int, items: array<string, int>}>
     */
    private const ORDERS = [
        ['customer' => 'Tall Pines Brewing', 'need_by_in_days' => 6, 'items' => ['B' => 125000]],
        ['customer' => 'Glacier Peak Seltzer', 'need_by_in_days' => 6, 'items' => ['D' => 12000]],
        ['customer' => 'Brightside Kombucha', 'need_by_in_days' => 7, 'items' => ['A' => 8000]],
        ['customer' => 'Saltmarsh Cold Brew', 'need_by_in_days' => 8, 'items' => ['C' => 15000]],
        ['customer' => 'Voltline Energy', 'need_by_in_days' => 9, 'items' => ['E' => 20000]],
        ['customer' => 'Glacier Peak Seltzer', 'need_by_in_days' => 9, 'items' => ['D' => 8000, 'E' => 6000]],
        ['customer' => 'Brightside Kombucha', 'need_by_in_days' => 10, 'items' => ['F' => 10000]],
        ['customer' => 'Saltmarsh Cold Brew', 'need_by_in_days' => 12, 'items' => ['C' => 12000]],
        ['customer' => 'Voltline Energy', 'need_by_in_days' => 13, 'items' => ['A' => 9000, 'F' => 6000]],
        ['customer' => 'Tall Pines Brewing', 'need_by_in_days' => 14, 'items' => ['C' => 10000]],
        ['customer' => 'Glacier Peak Seltzer', 'need_by_in_days' => 15, 'items' => ['B' => 14000]],
        ['customer' => 'Brightside Kombucha', 'need_by_in_days' => 16, 'items' => ['D' => 16000]],
        ['customer' => 'Saltmarsh Cold Brew', 'need_by_in_days' => 18, 'items' => ['E' => 10000]],
        ['customer' => 'Voltline Energy', 'need_by_in_days' => 20, 'items' => ['C' => 8000]],
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
        $today = CarbonImmutable::now(config('app.schedule_timezone'))->startOfDay();

        foreach (self::ORDERS as $demoOrder) {
            $orderProducts = collect($demoOrder['items'])->keys()->map(fn (string $name) => $products[$name]);

            $order = Order::create([
                'customer_id' => Customer::firstOrCreate(['name' => $demoOrder['customer']])->id,
                'product_type_id' => $orderProducts->first()->product_type_id,
                'need_by_date' => $today->addDays($demoOrder['need_by_in_days'])->toDateString(),
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
