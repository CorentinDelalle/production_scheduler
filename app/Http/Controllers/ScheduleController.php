<?php

namespace App\Http\Controllers;

use App\Http\Requests\ScheduleRequest;
use App\Models\Machine;
use App\Models\Order;
use App\Services\Assignment;
use App\Services\Scheduler;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function __invoke(ScheduleRequest $request, Scheduler $scheduler): Response
    {
        $start = $request->startDate();

        $orders = Order::with(['customer', 'productType', 'items.product'])->get();
        $machines = Machine::orderBy('id')->get();

        $assignments = $machines->isEmpty() ? [] : $scheduler->schedule($orders, $machines, $start);

        return Inertia::render('dashboard', [
            'start' => $start->toDateString(),
            'timezone' => config('app.schedule_timezone'),
            'machines' => $machines->map(fn (Machine $machine) => [
                'id' => $machine->id,
                'name' => $machine->name,
            ])->all(),
            'assignments' => array_map($this->assignmentToArray(...), $assignments),
            ...$this->orderFormOptions(),
        ]);
    }

    /**
     * @return array{orderId: int, machineId: int, customerId: int, customer: string, productType: string, productTypeId: int, quantity: int, items: array<int, array{productId: int, product: string, quantity: int}>, needByDate: string, changeoverStart: string, productionStart: string, end: string, isLate: bool}
     */
    private function assignmentToArray(Assignment $assignment): array
    {
        $order = $assignment->order;

        return [
            'orderId' => $order->id,
            'machineId' => $assignment->machineId,
            'customerId' => $order->customer_id,
            'customer' => $order->customer->name,
            'productType' => $order->productType->name,
            'productTypeId' => $order->product_type_id,
            'quantity' => (int) $order->items->sum('quantity'),
            'items' => $this->orderItemsToArray($order),
            'needByDate' => $order->need_by_date->toDateString(),
            'changeoverStart' => $assignment->changeoverStart->toIso8601String(),
            'productionStart' => $assignment->productionStart->toIso8601String(),
            'end' => $assignment->end->toIso8601String(),
            'isLate' => $assignment->isLate,
        ];
    }
}
