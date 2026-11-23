<?php

namespace Tests\Feature;

use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchemaConstraintsTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_product_type_still_used_cannot_be_deleted(): void
    {
        $product = Product::factory()->create();

        $this->expectException(QueryException::class);

        $product->productType->delete();
    }

    public function test_deleting_an_order_deletes_its_items(): void
    {
        $item = OrderItem::factory()->create();

        $item->order->delete();

        $this->assertModelMissing($item);
    }

    public function test_a_product_appears_at_most_once_per_order(): void
    {
        $item = OrderItem::factory()->create();

        $this->expectException(QueryException::class);

        OrderItem::factory()->create([
            'order_id' => $item->order_id,
            'product_id' => $item->product_id,
        ]);
    }
}
