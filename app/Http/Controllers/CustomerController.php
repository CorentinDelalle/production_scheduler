<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerRequest;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('customers/index', [
            'customers' => Customer::withCount('orders')->orderBy('name')->get()
                ->map(fn (Customer $customer) => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'ordersCount' => $customer->orders_count,
                ])->all(),
        ]);
    }

    public function store(CustomerRequest $request): RedirectResponse
    {
        $customer = Customer::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => "Customer “{$customer->name}” added."]);

        return back();
    }

    public function update(CustomerRequest $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => "Customer “{$customer->name}” updated."]);

        return back();
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        $usage = $this->describeUsage(['order' => $customer->orders()->count()]);

        if ($usage !== '') {
            Inertia::flash('toast', ['type' => 'error', 'message' => "“{$customer->name}” can’t be deleted: it is still used by {$usage}."]);

            return back();
        }

        $customer->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => "Customer “{$customer->name}” deleted."]);

        return back();
    }
}
