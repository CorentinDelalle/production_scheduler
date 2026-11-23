<?php

namespace Tests\Unit;

use App\Models\Machine;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductType;
use App\Services\Assignment;
use App\Services\Scheduler;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use InvalidArgumentException;
use Tests\TestCase;

class SchedulerTest extends TestCase
{
    private const TYPE_1_SPEED = 715;

    private const TYPE_2_SPEED = 770;

    private const TYPE_3_SPEED = 1000;

    private const CHANGEOVER = 30;

    public function test_it_returns_nothing_when_there_are_no_orders(): void
    {
        $assignments = (new Scheduler)->schedule(new Collection, new Collection([$this->makeMachine(1)]), $this->start());

        $this->assertSame([], $assignments);
    }

    public function test_it_requires_at_least_one_machine(): void
    {
        $this->expectException(InvalidArgumentException::class);

        (new Scheduler)->schedule(new Collection([$this->type1Order(1, [715], '2026-12-05')]), new Collection, $this->start());
    }

    public function test_first_order_pays_the_changeover_then_produces_rounded_up_to_the_minute(): void
    {
        $assignments = $this->schedule([$this->type1Order(1, [7000], '2026-12-05')], [1]);

        $this->assertCount(1, $assignments);
        $this->assertSame(1, $assignments[0]->order->id);
        $this->assertSame(1, $assignments[0]->machineId);
        $this->assertSame('2026-12-01 00:00:00', $assignments[0]->changeoverStart->toDateTimeString());
        $this->assertSame('2026-12-01 00:30:00', $assignments[0]->productionStart->toDateTimeString());
        $this->assertSame('2026-12-01 10:18:00', $assignments[0]->end->toDateTimeString());
        $this->assertFalse($assignments[0]->isLate);
    }

    public function test_duration_sums_all_lines_of_the_order(): void
    {
        // 3000 units at 715/h = 251.75 min, rounded up to 252 min (4 h 12).
        $assignments = $this->schedule([$this->type1Order(1, [1000, 2000], '2026-12-05')], [1]);

        $this->assertSame('2026-12-01 00:30:00', $assignments[0]->productionStart->toDateTimeString());
        $this->assertSame('2026-12-01 04:42:00', $assignments[0]->end->toDateTimeString());
    }

    public function test_consecutive_orders_of_the_same_type_have_no_second_changeover(): void
    {
        $assignments = $this->schedule([
            $this->type1Order(1, [7150], '2026-12-05'),
            $this->type1Order(2, [715], '2026-12-06'),
        ], [1]);

        $this->assertSame('2026-12-01 10:30:00', $assignments[0]->end->toDateTimeString());
        $this->assertSame(2, $assignments[1]->order->id);
        $this->assertSame('2026-12-01 10:30:00', $assignments[1]->changeoverStart->toDateTimeString());
        $this->assertSame('2026-12-01 10:30:00', $assignments[1]->productionStart->toDateTimeString());
        $this->assertSame('2026-12-01 11:30:00', $assignments[1]->end->toDateTimeString());
    }

    public function test_consecutive_orders_of_different_types_have_a_changeover_before_the_second(): void
    {
        $assignments = $this->schedule([
            $this->type1Order(1, [7150], '2026-12-05'),
            $this->type2Order(2, [770], '2026-12-06'),
        ], [1]);

        $this->assertSame('2026-12-01 10:30:00', $assignments[0]->end->toDateTimeString());
        $this->assertSame('2026-12-01 10:30:00', $assignments[1]->changeoverStart->toDateTimeString());
        $this->assertSame('2026-12-01 11:00:00', $assignments[1]->productionStart->toDateTimeString());
        $this->assertSame('2026-12-01 12:00:00', $assignments[1]->end->toDateTimeString());
    }

    public function test_the_changeover_time_is_the_one_of_the_type_switched_to(): void
    {
        $assignments = $this->schedule([
            $this->makeOrder(1, 1, self::TYPE_1_SPEED, 30, [7150], '2026-12-05'),
            $this->makeOrder(2, 2, self::TYPE_2_SPEED, 45, [770], '2026-12-06'),
        ], [1]);

        // Order 1: 30 min changeover + 600 min of production, ends at 10:30.
        $this->assertSame('2026-12-01 10:30:00', $assignments[1]->changeoverStart->toDateTimeString());
        $this->assertSame('2026-12-01 11:15:00', $assignments[1]->productionStart->toDateTimeString());
        $this->assertSame('2026-12-01 12:15:00', $assignments[1]->end->toDateTimeString());
    }

    public function test_orders_are_sequenced_by_need_by_date_regardless_of_input_order(): void
    {
        $assignments = $this->schedule([
            $this->type1Order(1, [715], '2026-12-09'),
            $this->type1Order(2, [715], '2026-12-03'),
            $this->type1Order(3, [715], '2026-12-06'),
        ], [1]);

        $this->assertSame([2, 3, 1], array_map(fn ($assignment) => $assignment->order->id, $assignments));
    }

    public function test_on_equal_need_by_dates_the_order_that_finishes_earliest_goes_first(): void
    {
        // Order 1 sets the machine up for type 1. Orders 2 (type 2) and 3 (type 1) then share a date:
        // order 3 saves the changeover, so it goes first even though its id is higher.
        $assignments = $this->schedule([
            $this->type1Order(1, [715], '2026-12-03'),
            $this->type2Order(2, [770], '2026-12-05'),
            $this->type1Order(3, [715], '2026-12-05'),
        ], [1]);

        $this->assertSame([1, 3, 2], array_map(fn ($assignment) => $assignment->order->id, $assignments));
        $this->assertSame('2026-12-01 02:30:00', $assignments[1]->end->toDateTimeString());
        $this->assertSame('2026-12-01 04:00:00', $assignments[2]->end->toDateTimeString());
    }

    public function test_on_a_full_tie_the_lowest_order_id_goes_first(): void
    {
        $assignments = $this->schedule([
            $this->type1Order(5, [715], '2026-12-05'),
            $this->type1Order(4, [715], '2026-12-05'),
        ], [1]);

        $this->assertSame([4, 5], array_map(fn ($assignment) => $assignment->order->id, $assignments));
    }

    public function test_an_order_goes_to_the_machine_where_it_ends_earliest(): void
    {
        $assignments = $this->schedule([
            $this->type1Order(1, [7150], '2026-12-03'),
            $this->type1Order(2, [715], '2026-12-05'),
        ], [1, 2]);

        // Order 1 takes machine 1 (tie), so order 2 ends earlier on the free machine 2.
        $this->assertSame(1, $assignments[0]->machineId);
        $this->assertSame(2, $assignments[1]->machineId);
        $this->assertSame('2026-12-01 01:30:00', $assignments[1]->end->toDateTimeString());
    }

    public function test_a_machine_already_set_up_for_the_type_is_preferred_when_it_ends_earlier(): void
    {
        $assignments = $this->schedule([
            $this->type1Order(1, [715], '2026-12-03'),
            $this->type2Order(2, [770], '2026-12-04'),
            $this->type1Order(3, [715], '2026-12-05'),
        ], [1, 2]);

        $this->assertSame([1, 2, 1], array_map(fn ($assignment) => $assignment->machineId, $assignments));
        // Machine 1 is free at 01:30 and already set up for type 1: 02:30. Machine 2 would need a changeover: 03:00.
        $this->assertSame('2026-12-01 01:30:00', $assignments[2]->productionStart->toDateTimeString());
        $this->assertSame('2026-12-01 02:30:00', $assignments[2]->end->toDateTimeString());
    }

    public function test_on_a_full_tie_between_machines_the_lowest_machine_id_wins(): void
    {
        $assignments = $this->schedule([$this->type1Order(1, [715], '2026-12-05')], [3, 2, 7]);

        $this->assertSame(2, $assignments[0]->machineId);
    }

    public function test_an_order_ending_after_its_need_by_day_is_late(): void
    {
        // 18096 units at 770/h = 1410.08 min, rounded up to 1411: ends at 00:01 the next day.
        $assignments = $this->schedule([$this->type2Order(1, [18096], '2026-12-01')], [1]);

        $this->assertSame('2026-12-02 00:01:00', $assignments[0]->end->toDateTimeString());
        $this->assertTrue($assignments[0]->isLate);
    }

    public function test_an_order_ending_exactly_at_midnight_after_its_need_by_day_is_on_time(): void
    {
        // 30 min changeover + 18095 units at 770/h (1410 min) = exactly 24 h.
        $assignments = $this->schedule([$this->type2Order(1, [18095], '2026-12-01')], [1]);

        $this->assertSame('2026-12-02 00:00:00', $assignments[0]->end->toDateTimeString());
        $this->assertFalse($assignments[0]->isLate);
    }

    public function test_an_order_ending_before_its_need_by_day_is_on_time(): void
    {
        $assignments = $this->schedule([$this->type3Order(1, [1000], '2026-12-02')], [1]);

        $this->assertFalse($assignments[0]->isLate);
    }

    public function test_the_late_flag_uses_the_end_of_the_need_by_day_in_the_start_timezone(): void
    {
        $start = CarbonImmutable::parse('2026-12-01 00:00:00', 'America/Toronto');
        $scheduler = new Scheduler;
        $machines = new Collection([$this->makeMachine(1)]);

        // 30 min changeover + 1380 min = ends 23:30 Montreal (04:30 UTC the next day).
        $onTime = $scheduler->schedule(new Collection([$this->type2Order(1, [17710], '2026-12-01')]), $machines, $start)[0];
        $this->assertSame('2026-12-01 23:30:00', $onTime->end->toDateTimeString());
        $this->assertSame('2026-12-02 04:30:00', $onTime->end->utc()->toDateTimeString());
        $this->assertFalse($onTime->isLate);

        // Ends 00:01 the next day in Montreal.
        $late = $scheduler->schedule(new Collection([$this->type2Order(1, [18096], '2026-12-01')]), $machines, $start)[0];
        $this->assertSame('2026-12-02 00:01:00', $late->end->toDateTimeString());
        $this->assertTrue($late->isLate);
    }

    public function test_durations_are_real_elapsed_minutes_across_a_daylight_saving_change(): void
    {
        // DST ends on 2026-11-01 at 02:00 in Montreal: 00:00 + 180 elapsed minutes = 02:00 EST.
        $start = CarbonImmutable::parse('2026-11-01 00:00:00', 'America/Toronto');

        // 30 min changeover + 150 min of production (1000 units at 400/h is 150 min).
        $order = $this->makeOrder(1, 1, 400, 30, [1000], '2026-11-05');
        $assignment = (new Scheduler)->schedule(new Collection([$order]), new Collection([$this->makeMachine(1)]), $start)[0];

        $this->assertSame('2026-11-01 07:00:00', $assignment->end->utc()->toDateTimeString());
        $this->assertSame('2026-11-01 02:00:00', $assignment->end->toDateTimeString());
        $this->assertSame(-300, $assignment->end->utcOffset());
    }

    /**
     * @param  list<Order>  $orders
     * @param  list<int>  $machineIds
     * @return list<Assignment>
     */
    private function schedule(array $orders, array $machineIds): array
    {
        return (new Scheduler)->schedule(
            new Collection($orders),
            new Collection(array_map(fn (int $id) => $this->makeMachine($id), $machineIds)),
            $this->start(),
        );
    }

    private function start(): CarbonImmutable
    {
        return CarbonImmutable::parse('2026-12-01 00:00:00', 'UTC');
    }

    /**
     * @param  list<int>  $quantities
     */
    private function type1Order(int $id, array $quantities, string $needByDate): Order
    {
        return $this->makeOrder($id, 1, self::TYPE_1_SPEED, self::CHANGEOVER, $quantities, $needByDate);
    }

    /**
     * @param  list<int>  $quantities
     */
    private function type2Order(int $id, array $quantities, string $needByDate): Order
    {
        return $this->makeOrder($id, 2, self::TYPE_2_SPEED, self::CHANGEOVER, $quantities, $needByDate);
    }

    /**
     * @param  list<int>  $quantities
     */
    private function type3Order(int $id, array $quantities, string $needByDate): Order
    {
        return $this->makeOrder($id, 3, self::TYPE_3_SPEED, self::CHANGEOVER, $quantities, $needByDate);
    }

    /**
     * Builds an order in memory, with its relations loaded and nothing persisted.
     *
     * @param  list<int>  $quantities
     */
    private function makeOrder(int $id, int $typeId, int $unitsPerHour, int $changeoverMinutes, array $quantities, string $needByDate): Order
    {
        $order = (new Order)->forceFill([
            'id' => $id,
            'product_type_id' => $typeId,
            'need_by_date' => $needByDate,
        ]);

        $order->setRelation('productType', (new ProductType)->forceFill([
            'id' => $typeId,
            'units_per_hour' => $unitsPerHour,
            'changeover_minutes' => $changeoverMinutes,
        ]));

        $order->setRelation('items', new Collection(array_map(
            fn (int $quantity) => (new OrderItem)->forceFill(['quantity' => $quantity]),
            $quantities,
        )));

        return $order;
    }

    private function makeMachine(int $id): Machine
    {
        return (new Machine)->forceFill(['id' => $id]);
    }
}
