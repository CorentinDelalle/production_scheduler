<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Machine;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get(route('dashboard'))->assertRedirect(route('login'));
    }

    public function test_the_start_date_defaults_to_today(): void
    {
        $this->travelTo('2026-03-10 02:00:00');
        Machine::factory()->create();

        $this->actingAs(User::factory()->create())
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('start', '2026-03-09')
                ->where('timezone', 'America/Toronto'));
    }

    public function test_a_given_start_date_is_used(): void
    {
        Machine::factory()->create();
        $order = Order::factory()->create(['need_by_date' => '2030-01-01']);
        OrderItem::factory()->for($order)->create(['quantity' => 600]);

        $this->actingAs(User::factory()->create())
            ->get(route('dashboard', ['start' => '2026-05-04']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('start', '2026-05-04')
                ->where('assignments.0.changeoverStart', '2026-05-04T00:00:00-04:00'));
    }

    public function test_without_machines_the_schedule_is_empty(): void
    {
        $order = Order::factory()->create();
        OrderItem::factory()->for($order)->create();

        $this->actingAs(User::factory()->create())
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->has('machines', 0)
                ->has('assignments', 0));
    }

    public function test_an_invalid_start_date_is_rejected(): void
    {
        $this->actingAs(User::factory()->create());

        foreach (['2026-13-45', 'tomorrow'] as $start) {
            $this->get(route('dashboard', ['start' => $start]))
                ->assertSessionHasErrors('start');
        }
    }

    /**
     * @return array<string, array{string}>
     */
    public static function malformedStartDates(): array
    {
        return [
            'impossible date' => ['2026-02-30'],
            'unpadded month and day' => ['2026-5-4'],
            'day-first date' => ['04/05/2026'],
            'date with a time' => ['2026-05-04 08:00'],
        ];
    }

    #[DataProvider('malformedStartDates')]
    public function test_a_malformed_start_date_is_rejected(string $start): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('dashboard', ['start' => $start]))
            ->assertSessionHasErrors('start');
    }

    public function test_it_returns_the_machines_and_assignments(): void
    {
        $type = ProductType::factory()->create(['units_per_hour' => 600, 'changeover_minutes' => 30]);
        $machine = Machine::factory()->create();
        $customer = Customer::factory()->create();

        $mostUrgent = Order::factory()->for($customer)->for($type)->create(['need_by_date' => '2026-05-04']);
        OrderItem::factory()->for($mostUrgent)->create(['quantity' => 600]);
        OrderItem::factory()->for($mostUrgent)->create(['quantity' => 1800]);

        $onTime = Order::factory()->for($customer)->for($type)->create(['need_by_date' => '2026-06-01']);
        OrderItem::factory()->for($onTime)->create(['quantity' => 600]);

        $this->actingAs(User::factory()->create())
            ->get(route('dashboard', ['start' => '2026-05-04']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->has('machines', 1)
                ->where('machines.0', ['id' => $machine->id, 'name' => $machine->name])
                ->has('assignments', 2)
                ->where('assignments.0.orderId', $mostUrgent->id)
                ->where('assignments.0.machineId', $machine->id)
                ->where('assignments.0.customer', $customer->name)
                ->where('assignments.0.productType', $type->name)
                ->where('assignments.0.productTypeId', $type->id)
                ->where('assignments.0.quantity', 2400)
                ->where('assignments.0.customerId', $customer->id)
                ->has('assignments.0.items', 2)
                ->where('assignments.0.items.0.quantity', 600)
                ->where('customers.0', ['id' => $customer->id, 'name' => $customer->name])
                ->has('productTypes', 1)
                ->where('productTypes.0.unitsPerHour', 600)
                ->where('assignments.0.needByDate', '2026-05-04')
                ->where('assignments.0.isLate', false)
                ->where('assignments.1.orderId', $onTime->id)
                ->where('assignments.1.isLate', false));
    }

    public function test_a_late_order_is_flagged(): void
    {
        $type = ProductType::factory()->create(['units_per_hour' => 100, 'changeover_minutes' => 30]);
        Machine::factory()->create();

        $order = Order::factory()->for($type)->create(['need_by_date' => '2026-05-04']);
        OrderItem::factory()->for($order)->create(['quantity' => 5000]);

        $this->actingAs(User::factory()->create())
            ->get(route('dashboard', ['start' => '2026-05-04']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('assignments.0.orderId', $order->id)
                ->where('assignments.0.isLate', true));
    }
}
