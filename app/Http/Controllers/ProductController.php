<?php

namespace App\Http\Controllers;

use App\Concerns\DescribesUsage;
use App\Http\Requests\ProductRequest;
use App\Models\Product;
use App\Models\ProductType;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    use DescribesUsage;

    public function index(): Response
    {
        return Inertia::render('products/index', [
            'products' => Product::with('productType')->withCount('orderItems')->orderBy('name')->get()
                ->map(fn (Product $product) => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'productTypeId' => $product->product_type_id,
                    'productType' => $product->productType->name,
                    'ordersCount' => $product->order_items_count,
                ])->all(),
            'productTypes' => ProductType::orderBy('name')->get()
                ->map(fn (ProductType $type) => ['id' => $type->id, 'name' => $type->name])
                ->all(),
        ]);
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        $product = Product::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => "Product “{$product->name}” added."]);

        return back();
    }

    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => "Product “{$product->name}” updated."]);

        return back();
    }

    public function destroy(Product $product): RedirectResponse
    {
        $usage = $this->describeUsage(['order' => $product->orderItems()->count()]);

        if ($usage !== '') {
            Inertia::flash('toast', ['type' => 'error', 'message' => "“{$product->name}” can’t be deleted: it is still used by {$usage}."]);

            return back();
        }

        $product->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => "Product “{$product->name}” deleted."]);

        return back();
    }
}
