<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProductControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get(route('products.index'))->assertRedirect(route('login'));
    }

    public function test_index_lists_products_with_their_orders_count(): void
    {
        $type = ProductType::factory()->create(['name' => 'Labels']);
        $product = Product::factory()->for($type)->create(['name' => 'Label A']);
        $order = Order::factory()->for($type)->create();
        OrderItem::factory()->for($order)->for($product)->create();

        $this->actingAs(User::factory()->create())
            ->get(route('products.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('products/index')
                ->where('products', [[
                    'id' => $product->id,
                    'name' => 'Label A',
                    'productTypeId' => $type->id,
                    'productType' => 'Labels',
                    'ordersCount' => 1,
                ]])
                ->where('productTypes', [['id' => $type->id, 'name' => 'Labels']]));
    }

    public function test_a_product_can_be_added_and_updated_keeping_its_name(): void
    {
        $type = ProductType::factory()->create();
        $this->actingAs(User::factory()->create());

        $this->post(route('products.store'), ['name' => 'Label A', 'product_type_id' => $type->id])
            ->assertInertiaFlash('toast', ['type' => 'success', 'message' => 'Product “Label A” added.']);

        $product = Product::firstWhere('name', 'Label A');
        $other = ProductType::factory()->create();

        $this->put(route('products.update', $product), ['name' => 'Label A', 'product_type_id' => $other->id])
            ->assertSessionHasNoErrors();

        $this->assertSame($other->id, $product->refresh()->product_type_id);
    }

    public function test_invalid_payloads_are_rejected(): void
    {
        $type = ProductType::factory()->create();
        Product::factory()->for($type)->create(['name' => 'Label A']);
        $this->actingAs(User::factory()->create());

        $this->post(route('products.store'), ['name' => 'Label A', 'product_type_id' => $type->id])
            ->assertSessionHasErrors('name');
        $this->post(route('products.store'), ['name' => 'Label B', 'product_type_id' => 9999])
            ->assertSessionHasErrors('product_type_id');
    }

    public function test_the_name_is_limited_to_255_characters_and_the_type_is_required(): void
    {
        $type = ProductType::factory()->create();
        $this->actingAs(User::factory()->create());

        $this->post(route('products.store'), ['name' => str_repeat('a', 256), 'product_type_id' => $type->id])
            ->assertSessionHasErrors('name');
        $this->post(route('products.store'), ['name' => 'Label A', 'product_type_id' => null])
            ->assertSessionHasErrors('product_type_id');
        $this->post(route('products.store'), ['name' => str_repeat('a', 255), 'product_type_id' => $type->id])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('products', 1);
    }

    public function test_a_product_cannot_be_renamed_to_another_products_name(): void
    {
        $type = ProductType::factory()->create();
        Product::factory()->for($type)->create(['name' => 'Label A']);
        $product = Product::factory()->for($type)->create(['name' => 'Label B']);

        $this->actingAs(User::factory()->create())
            ->put(route('products.update', $product), ['name' => 'Label A', 'product_type_id' => $type->id])
            ->assertSessionHasErrors('name');

        $this->assertSame('Label B', $product->refresh()->name);
    }

    public function test_an_unused_product_is_deleted(): void
    {
        $product = Product::factory()->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('products.destroy', $product))
            ->assertInertiaFlash('toast.type', 'success');

        $this->assertModelMissing($product);
    }

    public function test_a_product_in_an_order_is_not_deleted(): void
    {
        $order = Order::factory()->create();
        $item = OrderItem::factory()->for($order)->create();
        $product = $item->product;

        $this->actingAs(User::factory()->create())
            ->delete(route('products.destroy', $product))
            ->assertInertiaFlash('toast', [
                'type' => 'error',
                'message' => "“{$product->name}” can’t be deleted: it is still used by 1 order.",
            ]);

        $this->assertModelExists($product);
    }

    public function test_the_type_of_a_product_in_an_order_cannot_change(): void
    {
        $item = OrderItem::factory()->create();
        $product = $item->product;
        $other = ProductType::factory()->create();

        $this->actingAs(User::factory()->create())
            ->put(route('products.update', $product), ['name' => 'Renamed', 'product_type_id' => $other->id])
            ->assertSessionHasErrors('product_type_id');

        $this->put(route('products.update', $product), ['name' => 'Renamed', 'product_type_id' => $product->product_type_id])
            ->assertSessionHasNoErrors();

        $this->assertSame('Renamed', $product->refresh()->name);
    }
}
