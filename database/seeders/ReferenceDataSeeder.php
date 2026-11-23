<?php

namespace Database\Seeders;

use App\Models\Machine;
use App\Models\Product;
use App\Models\ProductType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ReferenceDataSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Product types with their speed in units per hour, and the products of each type.
     *
     * @var array<string, array{units_per_hour: int, products: list<string>}>
     */
    private const PRODUCT_TYPES = [
        'Type 1' => ['units_per_hour' => 715, 'products' => ['A', 'B', 'F']],
        'Type 2' => ['units_per_hour' => 770, 'products' => ['C']],
        'Type 3' => ['units_per_hour' => 1000, 'products' => ['D', 'E']],
    ];

    private const CHANGEOVER_MINUTES = 30;

    private const MACHINES = ['Machine 1', 'Machine 2'];

    /**
     * Create the reference data that is missing. Existing rows are never overwritten,
     * so values edited in the app survive the next deployment.
     */
    public function run(): void
    {
        foreach (self::PRODUCT_TYPES as $typeName => $type) {
            $productType = ProductType::firstOrCreate(['name' => $typeName], [
                'units_per_hour' => $type['units_per_hour'],
                'changeover_minutes' => self::CHANGEOVER_MINUTES,
            ]);

            foreach ($type['products'] as $productName) {
                Product::firstOrCreate(['name' => $productName], [
                    'product_type_id' => $productType->id,
                ]);
            }
        }

        foreach (self::MACHINES as $machineName) {
            Machine::firstOrCreate(['name' => $machineName]);
        }
    }
}
