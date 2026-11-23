<?php

namespace App\Services;

use App\Models\Machine;
use App\Models\Order;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use InvalidArgumentException;

/**
 * Greedy production scheduler. It reads only already loaded data and never queries the database.
 * Times are tracked as whole minutes since the start date.
 */
final class Scheduler
{
    /**
     * @param  Collection<int, Order>  $orders  Orders must have `items` and `productType` loaded.
     * @param  Collection<int, Machine>  $machines
     * @return list<Assignment>
     */
    public function schedule(Collection $orders, Collection $machines, CarbonImmutable $start): array
    {
        if ($machines->isEmpty()) {
            throw new InvalidArgumentException('At least one machine is required to build a schedule.');
        }

        /** @var array<int, array{freeAt: int, lastTypeId: int|null}> $machineStates */
        $machineStates = [];
        foreach ($machines->sortBy('id') as $machine) {
            $machineStates[$machine->id] = ['freeAt' => 0, 'lastTypeId' => null];
        }

        $remaining = $orders->values()->all();
        $assignments = [];

        while (($next = $this->pickNext($remaining, $machineStates)) !== null) {
            ['index' => $index, 'order' => $order, 'placement' => $placement] = $next;

            $machineStates[$placement['machineId']] = [
                'freeAt' => $placement['end'],
                'lastTypeId' => $order->product_type_id,
            ];

            $end = $start->addMinutes($placement['end']);

            $assignments[] = new Assignment(
                order: $order,
                machineId: $placement['machineId'],
                changeoverStart: $start->addMinutes($placement['changeoverStart']),
                productionStart: $start->addMinutes($placement['productionStart']),
                end: $end,
                isLate: $end > $order->need_by_date->addDay(),
            );

            unset($remaining[$index]);
        }

        return $assignments;
    }

    /**
     * Among the orders with the smallest need-by date, the one that would end earliest (lowest order id on a tie).
     * Not a static sort: the result depends on the current state of the machines.
     *
     * @param  array<int, Order>  $remaining
     * @param  array<int, array{freeAt: int, lastTypeId: int|null}>  $machineStates
     * @return array{index: int, order: Order, placement: array{machineId: int, changeoverStart: int, productionStart: int, end: int}}|null
     */
    private function pickNext(array $remaining, array $machineStates): ?array
    {
        $chosen = null;

        foreach ($this->mostUrgent($remaining) as $index => $order) {
            $placement = $this->bestPlacement($order, $machineStates);

            if ($chosen === null
                || $placement['end'] < $chosen['placement']['end']
                || ($placement['end'] === $chosen['placement']['end'] && $order->id < $chosen['order']->id)) {
                $chosen = ['index' => $index, 'order' => $order, 'placement' => $placement];
            }
        }

        return $chosen;
    }

    /**
     * The remaining orders sharing the smallest need-by date, keyed by their index in `$remaining`.
     *
     * @param  array<int, Order>  $remaining
     * @return array<int, Order>
     */
    private function mostUrgent(array $remaining): array
    {
        $earliestDate = null;
        $urgent = [];

        foreach ($remaining as $index => $order) {
            $date = $order->need_by_date->toDateString();

            if ($earliestDate === null || $date < $earliestDate) {
                $earliestDate = $date;
                $urgent = [];
            }

            if ($date === $earliestDate) {
                $urgent[$index] = $order;
            }
        }

        return $urgent;
    }

    /**
     * The machine where the order would end earliest. Machines are sorted by id, so ties go to the lowest id.
     *
     * @param  array<int, array{freeAt: int, lastTypeId: int|null}>  $machineStates
     * @return array{machineId: int, changeoverStart: int, productionStart: int, end: int}
     */
    private function bestPlacement(Order $order, array $machineStates): array
    {
        $duration = $this->durationInMinutes($order);
        $best = null;

        foreach ($machineStates as $machineId => $state) {
            $productionStart = $state['freeAt'] + $this->changeoverInMinutes($order, $state['lastTypeId']);
            $end = $productionStart + $duration;

            if ($best === null || $end < $best['end']) {
                $best = [
                    'machineId' => $machineId,
                    'changeoverStart' => $state['freeAt'],
                    'productionStart' => $productionStart,
                    'end' => $end,
                ];
            }
        }

        return $best;
    }

    /**
     * Production time in whole minutes, rounded up (integer math only).
     */
    private function durationInMinutes(Order $order): int
    {
        $totalQuantity = (int) $order->items->sum('quantity');
        $unitsPerHour = $order->productType->units_per_hour;

        return intdiv($totalQuantity * 60 + $unitsPerHour - 1, $unitsPerHour);
    }

    /**
     * The changeover applies when the machine has no order yet or last produced another type.
     */
    private function changeoverInMinutes(Order $order, ?int $lastTypeId): int
    {
        if ($lastTypeId === $order->product_type_id) {
            return 0;
        }

        return $order->productType->changeover_minutes;
    }
}
