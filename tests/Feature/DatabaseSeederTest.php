<?php

namespace Tests\Feature;

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
