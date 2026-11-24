<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Fixed data for the Playwright tests (`npm run test:e2e`), on top of the account and the reference data.
 *
 * Planned from 2030-01-07 on Machine 1 and Machine 2, the two orders give a known plan:
 * - Northwind (Type 1, 7,150 × A, due Jan 7): Machine 1, 00:30 to 10:30, on time;
 * - Last Call Lager (Type 3, 30,000 × D, due Jan 7): Machine 2, 00:30 to Jan 8 06:30, late.
 *
 * The Northwind name holds a tag that vis-timeline's own XSS filter lets through (a span with a class),
 * to check that our escaping shows it as text.
 */
class EndToEndSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call(DatabaseSeeder::class);

        $northwind = Customer::create(['name' => 'Northwind <span class="injected">Cider</span> & Co']);
        $lastCallLager = Customer::create(['name' => 'Last Call Lager']);
        Customer::create(['name' => 'Harbor Iced Tea']);

        $this->createOrder($northwind->id, '2030-01-07', 'A', 7150);
        $this->createOrder($lastCallLager->id, '2030-01-07', 'D', 30000);
    }

    private function createOrder(int $customerId, string $needByDate, string $productName, int $quantity): void
    {
        $product = Product::where('name', $productName)->firstOrFail();

        $order = Order::create([
            'customer_id' => $customerId,
            'product_type_id' => $product->product_type_id,
            'need_by_date' => $needByDate,
        ]);
        $order->items()->create(['product_id' => $product->id, 'quantity' => $quantity]);
    }
}
