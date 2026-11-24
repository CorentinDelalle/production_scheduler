<?php

namespace App\Http\Controllers;

use App\Concerns\PresentsOrders;
use App\Http\Requests\OrderRequest;
use App\Http\Requests\ScheduleRequest;
use App\Models\Machine;
use App\Models\Order;
use App\Services\Assignment;
use App\Services\Scheduler;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    use PresentsOrders;

    public function index(ScheduleRequest $request, Scheduler $scheduler): Response
    {
        $start = $request->startDate();

        $orders = Order::with(['customer', 'productType', 'items.product'])
            ->orderBy('need_by_date')
            ->orderBy('id')
            ->get();
        $machines = Machine::orderBy('id')->get();

        /** @var array<int, Assignment> $assignments */
        $assignments = [];
        if ($machines->isNotEmpty()) {
            foreach ($scheduler->schedule($orders, $machines, $start) as $assignment) {
                $assignments[$assignment->order->id] = $assignment;
            }
        }

        return Inertia::render('orders/index', [
            'start' => $start->toDateString(),
            'timezone' => config('app.schedule_timezone'),
            'orders' => $orders->map(fn (Order $order) => [
                'id' => $order->id,
                'customerId' => $order->customer_id,
                'customer' => $order->customer->name,
                'productTypeId' => $order->product_type_id,
                'productType' => $order->productType->name,
                'needByDate' => $order->need_by_date->toDateString(),
                'quantity' => (int) $order->items->sum('quantity'),
                'items' => $this->orderItemsToArray($order),
                'machine' => isset($assignments[$order->id])
                    ? $machines->firstWhere('id', $assignments[$order->id]->machineId)?->name
                    : null,
                'end' => ($assignments[$order->id] ?? null)?->end->toIso8601String(),
                'isLate' => ($assignments[$order->id] ?? null)?->isLate,
            ])->all(),
            ...$this->orderFormOptions(),
        ]);
    }

    public function store(OrderRequest $request): RedirectResponse
    {
        $order = DB::transaction(function () use ($request) {
            $order = Order::create($request->safe()->only(['customer_id', 'product_type_id', 'need_by_date']));
            $order->items()->createMany($request->validated('items'));

            return $order;
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => "Order #{$order->id} added."]);
        Inertia::flash('highlight', $order->id);

        return back();
    }

    public function update(OrderRequest $request, Order $order): RedirectResponse
    {
        DB::transaction(function () use ($request, $order) {
            $order->update($request->safe()->only(['customer_id', 'product_type_id', 'need_by_date']));
            $order->items()->delete();
            $order->items()->createMany($request->validated('items'));
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => "Order #{$order->id} updated."]);
        Inertia::flash('highlight', $order->id);

        return back();
    }

    public function destroy(Order $order): RedirectResponse
    {
        $order->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => "Order #{$order->id} deleted."]);

        return back();
    }
}
