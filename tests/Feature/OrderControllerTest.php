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
use PHPUnit\Framework\Attributes\DataProvider;
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

    /**
     * @return array<string, array{array<string, mixed>, string}>
     */
    public static function invalidOrderFields(): array
    {
        return [
            'no customer' => [['customer_id' => null], 'customer_id'],
            'no product type' => [['product_type_id' => null], 'product_type_id'],
            'unknown product type' => [['product_type_id' => 9999], 'product_type_id'],
            'no need-by date' => [['need_by_date' => null], 'need_by_date'],
            'impossible need-by date' => [['need_by_date' => '2030-02-30'], 'need_by_date'],
            'day-first need-by date' => [['need_by_date' => '01/02/2030'], 'need_by_date'],
            'need-by date with a time' => [['need_by_date' => '2030-01-01 10:00'], 'need_by_date'],
            'no products' => [['items' => null], 'items'],
            'products not a list' => [['items' => 'A'], 'items'],
            'unknown product' => [['items' => [['product_id' => 9999, 'quantity' => 5]]], 'items.0.product_id'],
            'line without a product' => [['items' => [['quantity' => 5]]], 'items.0.product_id'],
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    #[DataProvider('invalidOrderFields')]
    public function test_an_order_with_an_invalid_field_is_rejected(array $overrides, string $field): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('orders.store'), $this->payload($overrides))
            ->assertSessionHasErrors($field);

        $this->assertDatabaseCount('orders', 0);
    }

    /**
     * @return array<string, array{mixed}>
     */
    public static function invalidQuantities(): array
    {
        return [
            'missing' => [null],
            'decimal' => [1.5],
            'negative' => [-5],
            'text' => ['ten'],
        ];
    }

    #[DataProvider('invalidQuantities')]
    public function test_an_order_line_with_an_invalid_quantity_is_rejected(mixed $quantity): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('orders.store'), $this->payload(['items' => [['product_id' => $this->product->id, 'quantity' => $quantity]]]))
            ->assertSessionHasErrors('items.0.quantity');

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_a_quantity_of_one_is_accepted(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('orders.store'), $this->payload(['items' => [['product_id' => $this->product->id, 'quantity' => 1]]]))
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('order_items', ['product_id' => $this->product->id, 'quantity' => 1]);
    }

    public function test_product_errors_say_how_to_fix_the_line(): void
    {
        $otherTypeProduct = Product::factory()->create();
        $this->actingAs(User::factory()->create());

        $this->post(route('orders.store'), $this->payload(['items' => [['product_id' => $otherTypeProduct->id, 'quantity' => 5]]]))
            ->assertSessionHasErrors(['items.0.product_id' => 'Choose a product of the selected type.']);
        $this->post(route('orders.store'), $this->payload(['items' => [
            ['product_id' => $this->product->id, 'quantity' => 5],
            ['product_id' => $this->product->id, 'quantity' => 5],
        ]]))->assertSessionHasErrors(['items.1.product_id' => 'This product is already on the order.']);
    }

    public function test_an_order_changes_type_only_with_products_of_the_new_type(): void
    {
        $order = Order::factory()->for($this->customer)->for($this->type)->create();
        OrderItem::factory()->for($order)->for($this->product)->create();
        $newType = ProductType::factory()->create();
        $newTypeProduct = Product::factory()->for($newType)->create();
        $this->actingAs(User::factory()->create());

        $this->put(route('orders.update', $order), $this->payload(['product_type_id' => $newType->id]))
            ->assertSessionHasErrors('items.0.product_id');
        $this->assertSame($this->type->id, $order->refresh()->product_type_id);

        $this->put(route('orders.update', $order), $this->payload([
            'product_type_id' => $newType->id,
            'items' => [['product_id' => $newTypeProduct->id, 'quantity' => 10]],
        ]))->assertSessionHasNoErrors();
        $this->assertSame($newType->id, $order->refresh()->product_type_id);
        $this->assertSame($newTypeProduct->id, $order->items()->sole()->product_id);
    }

    public function test_an_invalid_start_date_is_rejected(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('orders.index', ['start' => '2026-02-30']))
            ->assertSessionHasErrors('start');
    }

    public function test_the_orders_page_shows_the_same_planning_as_the_plan(): void
    {
        $machines = Machine::factory()->count(2)->create();
        $otherType = ProductType::factory()->create(['units_per_hour' => 300, 'changeover_minutes' => 45]);
        $otherTypeProduct = Product::factory()->for($otherType)->create();
        // Created out of need-by order: the plan loads orders by id, the orders page by need-by date.
        foreach ([
            [$this->type, $this->product, '2026-05-08', 6000],
            [$otherType, $otherTypeProduct, '2026-05-04', 9000],
            [$this->type, $this->product, '2026-05-04', 30000],
            [$otherType, $otherTypeProduct, '2026-05-06', 300],
            [$this->type, $this->product, '2026-05-05', 600],
        ] as [$type, $product, $needByDate, $quantity]) {
            $order = Order::factory()->for($this->customer)->for($type)->create(['need_by_date' => $needByDate]);
            OrderItem::factory()->for($order)->for($product)->create(['quantity' => $quantity]);
        }
        $this->actingAs(User::factory()->create());

        $plan = $this->get(route('dashboard', ['start' => '2026-05-04']))->inertiaProps('assignments');
        $list = $this->get(route('orders.index', ['start' => '2026-05-04']))->inertiaProps('orders');

        $planned = collect($plan)->mapWithKeys(fn (array $assignment) => [$assignment['orderId'] => [
            'machine' => $machines->firstWhere('id', $assignment['machineId'])?->name,
            'end' => $assignment['end'],
            'isLate' => $assignment['isLate'],
        ]])->sortKeys()->all();
        $listed = collect($list)->mapWithKeys(fn (array $order) => [$order['id'] => [
            'machine' => $order['machine'],
            'end' => $order['end'],
            'isLate' => $order['isLate'],
        ]])->sortKeys()->all();
        $this->assertCount(5, $listed);
        $this->assertSame($planned, $listed);
        $this->assertContains(true, array_column($listed, 'isLate'));
        $this->assertContains(false, array_column($listed, 'isLate'));
    }

    public function test_a_quantity_of_one_million_is_accepted(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('orders.store'), $this->payload(['items' => [['product_id' => $this->product->id, 'quantity' => 1_000_000]]]))
            ->assertSessionHasNoErrors();
    }

    public function test_the_need_by_date_cannot_be_before_today_in_the_schedule_timezone(): void
    {
        config(['app.schedule_timezone' => 'America/Toronto']);
        $this->travelTo('2026-11-25 03:00:00 UTC'); // 22:00 on Nov 24 in Montreal.
        $this->actingAs(User::factory()->create());

        $this->post(route('orders.store'), $this->payload(['need_by_date' => '2026-11-23']))
            ->assertSessionHasErrors(['need_by_date' => 'The need-by date cannot be in the past.']);
        $this->post(route('orders.store'), $this->payload(['need_by_date' => '2026-11-24']))
            ->assertSessionHasNoErrors();

        $this->assertSame(1, Order::count());
    }

    public function test_an_order_due_in_the_past_can_be_updated_if_its_date_is_unchanged(): void
    {
        $this->travelTo('2026-11-24 12:00:00 UTC');
        $order = Order::factory()->for($this->customer)->for($this->type)->create(['need_by_date' => '2026-11-20']);
        OrderItem::factory()->for($order)->for($this->product)->create(['quantity' => 100]);
        $this->actingAs(User::factory()->create());

        $this->put(route('orders.update', $order), $this->payload(['need_by_date' => '2026-11-20']))
            ->assertSessionHasNoErrors();
        $this->put(route('orders.update', $order), $this->payload(['need_by_date' => '2026-11-21']))
            ->assertSessionHasErrors('need_by_date');

        $this->assertSame('2026-11-20', $order->refresh()->need_by_date->toDateString());
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
