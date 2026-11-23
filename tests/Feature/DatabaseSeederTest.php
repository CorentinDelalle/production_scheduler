<?php

namespace Tests\Feature;

use App\Models\Machine;
use App\Models\Product;
use App\Models\ProductType;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeding_twice_keeps_a_single_verified_account_with_the_latest_password(): void
    {
        config([
            'auth.seeded_user.email' => 'Reviewer@Example.com',
            'auth.seeded_user.password' => 'first-password',
        ]);
        $this->seed(DatabaseSeeder::class);

        config(['auth.seeded_user.password' => 'second-password']);
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseCount('users', 1);

        $user = User::firstOrFail();
        $this->assertSame('reviewer@example.com', $user->email);
        $this->assertTrue(Hash::check('second-password', $user->password));
        $this->assertTrue($user->hasVerifiedEmail());
    }

    public function test_reference_data_is_created_once_and_never_overwritten(): void
    {
        config([
            'auth.seeded_user.email' => 'reviewer@example.com',
            'auth.seeded_user.password' => 'password',
        ]);
        $this->seed(DatabaseSeeder::class);

        ProductType::where('name', 'Type 1')->update(['units_per_hour' => 800]);
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseCount('product_types', 3);
        $this->assertDatabaseCount('products', 6);
        $this->assertDatabaseCount('machines', 2);
        $this->assertSame(800, ProductType::where('name', 'Type 1')->value('units_per_hour'));
        $this->assertSame('Type 1', Product::where('name', 'F')->firstOrFail()->productType->name);
        $this->assertSame(['Machine 1', 'Machine 2'], Machine::orderBy('name')->pluck('name')->all());
    }

    public function test_seeding_fails_without_credentials(): void
    {
        config([
            'auth.seeded_user.email' => null,
            'auth.seeded_user.password' => null,
        ]);

        $this->expectException(RuntimeException::class);

        $this->seed(DatabaseSeeder::class);
    }
}
