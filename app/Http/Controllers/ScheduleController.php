<?php

namespace App\Http\Controllers;

use App\Http\Requests\ScheduleRequest;
use App\Models\Machine;
use App\Models\Order;
use App\Services\Assignment;
use App\Services\Scheduler;
use Carbon\CarbonImmutable;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function __invoke(ScheduleRequest $request, Scheduler $scheduler): Response
    {
        $timezone = config('app.schedule_timezone');
        $validatedStart = $request->validated('start');
        $start = $validatedStart === null
            ? CarbonImmutable::now($timezone)->startOfDay()
            : CarbonImmutable::parse($validatedStart, $timezone)->startOfDay();

        $orders = Order::with(['customer', 'productType', 'items'])->get();
        $machines = Machine::orderBy('id')->get();

        $assignments = $machines->isEmpty() ? [] : $scheduler->schedule($orders, $machines, $start);

        return Inertia::render('schedule', [
            'start' => $start->toDateString(),
            'timezone' => $timezone,
            'machines' => $machines->map(fn (Machine $machine) => [
                'id' => $machine->id,
                'name' => $machine->name,
            ])->all(),
            'assignments' => array_map($this->assignmentToArray(...), $assignments),
        ]);
    }

    /**
     * @return array{orderId: int, machineId: int, customer: string, productType: string, productTypeId: int, quantity: int, needByDate: string, changeoverStart: string, productionStart: string, end: string, isLate: bool}
     */
    private function assignmentToArray(Assignment $assignment): array
    {
        $order = $assignment->order;

        return [
            'orderId' => $order->id,
            'machineId' => $assignment->machineId,
            'customer' => $order->customer->name,
            'productType' => $order->productType->name,
            'productTypeId' => $order->product_type_id,
            'quantity' => (int) $order->items->sum('quantity'),
            'needByDate' => $order->need_by_date->toDateString(),
            'changeoverStart' => $assignment->changeoverStart->toIso8601String(),
            'productionStart' => $assignment->productionStart->toIso8601String(),
            'end' => $assignment->end->toIso8601String(),
            'isLate' => $assignment->isLate,
        ];
    }
}
