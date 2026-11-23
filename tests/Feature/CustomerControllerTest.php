<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CustomerControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get(route('customers.index'))->assertRedirect(route('login'));
    }

    public function test_index_lists_customers_with_their_orders_count(): void
    {
        $customer = Customer::factory()->create(['name' => 'Acme']);
        Order::factory()->count(2)->for($customer)->create();

        $this->actingAs(User::factory()->create())
            ->get(route('customers.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('customers/index')
                ->where('customers', [['id' => $customer->id, 'name' => 'Acme', 'ordersCount' => 2]]));
    }

    public function test_a_customer_can_be_added_and_renamed(): void
    {
        $this->actingAs(User::factory()->create());

        $this->post(route('customers.store'), ['name' => 'Acme'])
            ->assertRedirect()
            ->assertInertiaFlash('toast', ['type' => 'success', 'message' => 'Customer “Acme” added.']);

        $customer = Customer::firstWhere('name', 'Acme');

        $this->put(route('customers.update', $customer), ['name' => 'Globex'])
            ->assertInertiaFlash('toast', ['type' => 'success', 'message' => 'Customer “Globex” updated.']);

        $this->assertSame('Globex', $customer->refresh()->name);
    }

    public function test_the_name_is_required(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('customers.store'), ['name' => ''])
            ->assertSessionHasErrors('name');
    }

    public function test_an_unused_customer_is_deleted(): void
    {
        $customer = Customer::factory()->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('customers.destroy', $customer))
            ->assertInertiaFlash('toast.type', 'success');

        $this->assertModelMissing($customer);
    }

    public function test_a_customer_with_orders_is_not_deleted(): void
    {
        $customer = Customer::factory()->create(['name' => 'Acme']);
        Order::factory()->count(3)->for($customer)->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('customers.destroy', $customer))
            ->assertInertiaFlash('toast', [
                'type' => 'error',
                'message' => '“Acme” can’t be deleted: it is still used by 3 orders.',
            ]);

        $this->assertModelExists($customer);
    }
}
