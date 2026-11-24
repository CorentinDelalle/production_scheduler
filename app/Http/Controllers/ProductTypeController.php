<?php

namespace App\Http\Controllers;

use App\Concerns\DescribesUsage;
use App\Http\Requests\ProductTypeRequest;
use App\Models\ProductType;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProductTypeController extends Controller
{
    use DescribesUsage;

    public function index(): Response
    {
        return Inertia::render('product-types/index', [
            'productTypes' => ProductType::withCount(['products', 'orders'])->orderBy('name')->get()
                ->map(fn (ProductType $type) => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'unitsPerHour' => $type->units_per_hour,
                    'changeoverMinutes' => $type->changeover_minutes,
                    'productsCount' => $type->products_count,
                    'ordersCount' => $type->orders_count,
                ])->all(),
        ]);
    }

    public function store(ProductTypeRequest $request): RedirectResponse
    {
        $type = ProductType::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => "Product type “{$type->name}” added."]);

        return back();
    }

    public function update(ProductTypeRequest $request, ProductType $productType): RedirectResponse
    {
        $productType->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => "Product type “{$productType->name}” updated."]);

        return back();
    }

    public function destroy(ProductType $productType): RedirectResponse
    {
        $usage = $this->describeUsage([
            'order' => $productType->orders()->count(),
            'product' => $productType->products()->count(),
        ]);

        if ($usage !== '') {
            Inertia::flash('toast', ['type' => 'error', 'message' => "“{$productType->name}” can’t be deleted: it is still used by {$usage}."]);

            return back();
        }

        $productType->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => "Product type “{$productType->name}” deleted."]);

        return back();
    }
}
