<?php

namespace App\Http\Controllers;

use App\Concerns\PresentsOrders;
use App\Http\Requests\ScheduleRequest;
use App\Models\Machine;
use App\Services\Assignment;
use App\Services\Scheduler;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    use PresentsOrders;

    public function __invoke(ScheduleRequest $request, Scheduler $scheduler): Response
    {
        $start = $request->startDate();

        ['machines' => $machines, 'assignments' => $assignments] = $this->plan($scheduler, $start);

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
     * @return array{orderId: int, machineId: int, customerId: int, customer: string, productTypeId: int, productType: string, needByDate: string, quantity: int, items: array<int, array{productId: int, product: string, quantity: int}>, changeoverStart: string, productionStart: string, end: string, isLate: bool}
     */
    private function assignmentToArray(Assignment $assignment): array
    {
        return [
            'orderId' => $assignment->order->id,
            'machineId' => $assignment->machineId,
            ...$this->orderToArray($assignment->order),
            'changeoverStart' => $assignment->changeoverStart->toIso8601String(),
            'productionStart' => $assignment->productionStart->toIso8601String(),
            'end' => $assignment->end->toIso8601String(),
            'isLate' => $assignment->isLate,
        ];
    }
}
