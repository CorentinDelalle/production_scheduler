<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database. Safe to run on every deployment.
     */
    public function run(): void
    {
        if (blank(config('auth.seeded_user.email')) || blank(config('auth.seeded_user.password'))) {
            throw new RuntimeException('Set SEEDED_USER_EMAIL and SEEDED_USER_PASSWORD before seeding.');
        }

        $user = User::updateOrCreate(
            ['email' => Str::lower(config()->string('auth.seeded_user.email'))],
            [
                'name' => config()->string('auth.seeded_user.name'),
                'password' => config()->string('auth.seeded_user.password'),
            ],
        );

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        $this->call(ReferenceDataSeeder::class);
    }
}
