<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProductTypeControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge(['name' => 'Labels', 'units_per_hour' => 600, 'changeover_minutes' => 30], $overrides);
    }

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get(route('product-types.index'))->assertRedirect(route('login'));
    }

    public function test_index_lists_types_with_counts(): void
    {
        $type = ProductType::factory()->create(['name' => 'Labels', 'units_per_hour' => 600, 'changeover_minutes' => 30]);
        Product::factory()->count(2)->for($type)->create();
        Order::factory()->for($type)->create();

        $this->actingAs(User::factory()->create())
            ->get(route('product-types.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('product-types/index')
                ->where('productTypes', [[
                    'id' => $type->id,
                    'name' => 'Labels',
                    'unitsPerHour' => 600,
                    'changeoverMinutes' => 30,
                    'productsCount' => 2,
                    'ordersCount' => 1,
                ]]));
    }

    public function test_a_type_can_be_added_and_updated_keeping_its_name(): void
    {
        $this->actingAs(User::factory()->create());

        $this->post(route('product-types.store'), $this->payload())
            ->assertInertiaFlash('toast', ['type' => 'success', 'message' => 'Product type “Labels” added.']);

        $type = ProductType::firstWhere('name', 'Labels');

        $this->put(route('product-types.update', $type), $this->payload(['units_per_hour' => 900]))
            ->assertSessionHasNoErrors();

        $this->assertSame(900, $type->refresh()->units_per_hour);
    }

    public function test_invalid_payloads_are_rejected(): void
    {
        ProductType::factory()->create(['name' => 'Labels']);
        $this->actingAs(User::factory()->create());

        $this->post(route('product-types.store'), $this->payload())->assertSessionHasErrors('name');
        $this->post(route('product-types.store'), $this->payload(['name' => 'Cards', 'units_per_hour' => 0]))
            ->assertSessionHasErrors('units_per_hour');
        $this->post(route('product-types.store'), $this->payload(['name' => 'Cards', 'changeover_minutes' => -1]))
            ->assertSessionHasErrors('changeover_minutes');
        $this->post(route('product-types.store'), $this->payload(['name' => 'Cards', 'changeover_minutes' => 0]))
            ->assertSessionHasNoErrors();
    }

    public function test_an_unused_type_is_deleted(): void
    {
        $type = ProductType::factory()->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('product-types.destroy', $type))
            ->assertInertiaFlash('toast.type', 'success');

        $this->assertModelMissing($type);
    }

    public function test_a_type_in_use_is_not_deleted(): void
    {
        $type = ProductType::factory()->create(['name' => 'Labels']);
        Order::factory()->count(3)->for($type)->create();
        Product::factory()->count(2)->for($type)->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('product-types.destroy', $type))
            ->assertInertiaFlash('toast', [
                'type' => 'error',
                'message' => '“Labels” can’t be deleted: it is still used by 3 orders and 2 products.',
            ]);

        $this->assertModelExists($type);
    }
}
