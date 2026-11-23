<?php

namespace Database\Factories;

use App\Models\ProductType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductType>
 */
class ProductTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'Type '.fake()->unique()->numberBetween(1, 999),
            'units_per_hour' => fake()->numberBetween(500, 1200),
            'changeover_minutes' => 30,
        ];
    }
}
