<?php

namespace Tests\Feature;

use App\Models\Machine;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MachineControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $this->get(route('machines.index'))->assertRedirect(route('login'));
    }

    public function test_index_lists_machines(): void
    {
        $machine = Machine::factory()->create(['name' => 'Press 1']);

        $this->actingAs(User::factory()->create())
            ->get(route('machines.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('machines/index')
                ->where('machines', [['id' => $machine->id, 'name' => 'Press 1']]));
    }

    public function test_a_machine_can_be_added_and_renamed(): void
    {
        $this->actingAs(User::factory()->create());

        $this->post(route('machines.store'), ['name' => 'Press 1'])
            ->assertInertiaFlash('toast', ['type' => 'success', 'message' => 'Machine “Press 1” added.']);

        $machine = Machine::firstWhere('name', 'Press 1');

        $this->put(route('machines.update', $machine), ['name' => 'Press 1'])->assertSessionHasNoErrors();
        $this->put(route('machines.update', $machine), ['name' => 'Press A'])->assertSessionHasNoErrors();

        $this->assertSame('Press A', $machine->refresh()->name);
    }

    public function test_the_name_is_required_and_unique(): void
    {
        Machine::factory()->create(['name' => 'Press 1']);
        $this->actingAs(User::factory()->create());

        $this->post(route('machines.store'), ['name' => ''])->assertSessionHasErrors('name');
        $this->post(route('machines.store'), ['name' => 'Press 1'])->assertSessionHasErrors('name');
    }

    public function test_a_machine_is_deleted_when_another_remains(): void
    {
        [$machine] = Machine::factory()->count(2)->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('machines.destroy', $machine))
            ->assertInertiaFlash('toast.type', 'success');

        $this->assertModelMissing($machine);
    }

    public function test_the_last_machine_is_not_deleted(): void
    {
        $machine = Machine::factory()->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('machines.destroy', $machine))
            ->assertInertiaFlash('toast', ['type' => 'error', 'message' => 'The plan needs at least one machine.']);

        $this->assertModelExists($machine);
    }
}
