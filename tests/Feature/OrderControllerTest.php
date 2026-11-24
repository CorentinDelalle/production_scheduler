<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Machine;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OrderControllerTest extends TestCase
{
    use RefreshDatabase;

    private ProductType $type;

    private Customer $customer;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->type = ProductType::factory()->create(['units_per_hour' => 600, 'changeover_minutes' => 30]);
        $this->customer = Customer::factory()->create();
        $this->product = Product::factory()->for($this->type)->create();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'customer_id' => $this->customer->id,
            'product_type_id' => $this->type->id,
            'need_by_date' => '2030-01-01',
            'items' => [['product_id' => $this->product->id, 'quantity' => 600]],
        ], $overrides);
    }

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get(route('orders.index'))->assertRedirect(route('login'));
    }

    public function test_index_returns_orders_with_their_planning(): void
    {
        Machine::factory()->create(['name' => 'Press 1']);
        $late = Order::factory()->for($this->customer)->for($this->type)->create(['need_by_date' => '2026-05-04']);
        OrderItem::factory()->for($late)->for($this->product)->create(['quantity' => 60000]);
        $onTime = Order::factory()->for($this->customer)->for($this->type)->create(['need_by_date' => '2030-01-01']);
        OrderItem::factory()->for($onTime)->for($this->product)->create(['quantity' => 600]);

        $this->actingAs(User::factory()->create())
            ->get(route('orders.index', ['start' => '2026-05-04']))
            ->assertInertia(fn (Assert $page) => $page
                ->component('orders/index')
                ->where('start', '2026-05-04')
                ->where('timezone', 'America/Toronto')
                ->has('orders', 2)
                ->where('orders.0.id', $late->id)
                ->where('orders.0.customerId', $this->customer->id)
                ->where('orders.0.customer', $this->customer->name)
                ->where('orders.0.productTypeId', $this->type->id)
                ->where('orders.0.productType', $this->type->name)
                ->where('orders.0.needByDate', '2026-05-04')
                ->where('orders.0.quantity', 60000)
                ->where('orders.0.items', [['productId' => $this->product->id, 'product' => $this->product->name, 'quantity' => 60000]])
                ->where('orders.0.machine', 'Press 1')
                ->where('orders.0.isLate', true)
                ->whereType('orders.0.end', 'string')
                ->where('orders.1.id', $onTime->id)
                ->where('orders.1.isLate', false)
                ->where('customers.0.id', $this->customer->id)
                ->where('productTypes.0.products.0', ['id' => $this->product->id, 'name' => $this->product->name])
                ->where('productTypes.0.unitsPerHour', 600)
                ->where('productTypes.0.changeoverMinutes', 30));
    }

    public function test_index_has_no_planning_without_machines(): void
    {
        $order = Order::factory()->create();
        OrderItem::factory()->for($order)->create();

        $this->actingAs(User::factory()->create())
            ->get(route('orders.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('orders.0.machine', null)
                ->where('orders.0.end', null)
                ->where('orders.0.isLate', null));
    }

    public function test_an_order_can_be_added(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('orders.store'), $this->payload())
            ->assertRedirect();

        $order = Order::with('items')->firstOrFail();

        $this->assertSame($this->customer->id, $order->customer_id);
        $this->assertSame('2030-01-01', $order->need_by_date->toDateString());
        $this->assertSame(600, $order->items->sole()->quantity);
    }

    public function test_adding_an_order_flashes_a_toast_and_a_highlight(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('orders.store'), $this->payload())
            ->assertInertiaFlash('toast', ['type' => 'success', 'message' => 'Order #'.Order::firstOrFail()->id.' added.'])
            ->assertInertiaFlash('highlight', Order::firstOrFail()->id);
    }

    public function test_invalid_orders_are_rejected(): void
    {
        $otherTypeProduct = Product::factory()->create();
        $this->actingAs(User::factory()->create());

        $this->post(route('orders.store'), $this->payload(['items' => [['product_id' => $otherTypeProduct->id, 'quantity' => 5]]]))
            ->assertSessionHasErrors('items.0.product_id');

        $this->post(route('orders.store'), $this->payload(['items' => [
            ['product_id' => $this->product->id, 'quantity' => 5],
            ['product_id' => $this->product->id, 'quantity' => 5],
        ]]))->assertSessionHasErrors(['items.0.product_id', 'items.1.product_id']);

        $this->post(route('orders.store'), $this->payload(['items' => [['product_id' => $this->product->id, 'quantity' => 0]]]))
            ->assertSessionHasErrors('items.0.quantity');
        $this->post(route('orders.store'), $this->payload(['items' => [['product_id' => $this->product->id, 'quantity' => 1_000_001]]]))
            ->assertSessionHasErrors('items.0.quantity');

        $this->post(route('orders.store'), $this->payload(['items' => []]))->assertSessionHasErrors('items');
        $this->post(route('orders.store'), $this->payload(['need_by_date' => 'soon']))->assertSessionHasErrors('need_by_date');
        $this->post(route('orders.store'), $this->payload(['customer_id' => 9999]))->assertSessionHasErrors('customer_id');

        $this->assertSame(0, Order::count());
    }

    public function test_a_quantity_of_one_million_is_accepted(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('orders.store'), $this->payload(['items' => [['product_id' => $this->product->id, 'quantity' => 1_000_000]]]))
            ->assertSessionHasNoErrors();
    }

    public function test_updating_an_order_replaces_its_items(): void
    {
        $order = Order::factory()->for($this->customer)->for($this->type)->create();
        OrderItem::factory()->for($order)->for($this->product)->create(['quantity' => 100]);
        $newProduct = Product::factory()->for($this->type)->create();

        $this->actingAs(User::factory()->create())
            ->put(route('orders.update', $order), $this->payload([
                'need_by_date' => '2031-02-03',
                'items' => [['product_id' => $newProduct->id, 'quantity' => 250]],
            ]))
            ->assertSessionHasNoErrors()
            ->assertInertiaFlash('toast', ['type' => 'success', 'message' => "Order #{$order->id} updated."])
            ->assertInertiaFlash('highlight', $order->id);

        $order->refresh()->load('items');

        $this->assertSame('2031-02-03', $order->need_by_date->toDateString());
        $item = $order->items->sole();
        $this->assertSame($newProduct->id, $item->product_id);
        $this->assertSame(250, $item->quantity);
    }

    public function test_deleting_an_order_deletes_its_items(): void
    {
        $order = Order::factory()->create();
        $item = OrderItem::factory()->for($order)->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('orders.destroy', $order))
            ->assertRedirect();

        $this->assertModelMissing($order);
        $this->assertModelMissing($item);
    }
}
