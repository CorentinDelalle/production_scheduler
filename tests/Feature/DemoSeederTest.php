<?php

namespace Tests\Feature;

use App\Models\Order;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_orders_only_contain_products_of_their_type(): void
    {
        $this->seed(DemoSeeder::class);

        $orders = Order::with('items.product')->get();

        $this->assertCount(10, $orders);
        foreach ($orders as $order) {
            $this->assertNotEmpty($order->items);
            foreach ($order->items as $item) {
                $this->assertSame($order->product_type_id, $item->product->product_type_id);
            }
        }
    }

    public function test_running_the_demo_seeder_twice_does_not_duplicate_orders(): void
    {
        $this->seed(DemoSeeder::class);
        $this->seed(DemoSeeder::class);

        $this->assertDatabaseCount('orders', 10);
        $this->assertDatabaseCount('customers', 5);
    }
}
