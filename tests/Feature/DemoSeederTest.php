<?php

namespace Tests\Feature;

use App\Models\Machine;
use App\Models\Order;
use App\Services\Assignment;
use App\Services\Scheduler;
use Carbon\CarbonImmutable;
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

        $this->assertCount(14, $orders);
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

        $this->assertDatabaseCount('orders', 14);
        $this->assertDatabaseCount('customers', 5);
    }

    public function test_no_demo_order_is_due_within_five_days(): void
    {
        $this->seed(DemoSeeder::class);

        $sixDaysFromNow = CarbonImmutable::now(config('app.schedule_timezone'))->addDays(6)->toDateString();

        foreach (Order::all() as $order) {
            $this->assertGreaterThanOrEqual($sixDaysFromNow, $order->need_by_date->toDateString());
        }
    }

    public function test_the_demo_plan_shows_one_late_order_for_five_days_after_seeding(): void
    {
        $this->seed(DemoSeeder::class);

        $orders = Order::with(['items', 'productType'])->get();
        $machines = Machine::orderBy('id')->get();
        $today = CarbonImmutable::now(config('app.schedule_timezone'))->startOfDay();

        foreach (range(0, 5) as $daysAfterSeeding) {
            $assignments = app(Scheduler::class)->schedule($orders, $machines, $today->addDays($daysAfterSeeding));
            $lateCount = count(array_filter($assignments, fn (Assignment $assignment) => $assignment->isLate));

            $this->assertSame(1, $lateCount, "{$daysAfterSeeding} days after seeding");
        }
    }
}
