<?php

namespace App\Services;

use App\Models\Order;
use Carbon\CarbonImmutable;

/**
 * One order placed on one machine. Without a changeover, `changeoverStart` equals `productionStart`.
 */
final readonly class Assignment
{
    public function __construct(
        public Order $order,
        public int $machineId,
        public CarbonImmutable $changeoverStart,
        public CarbonImmutable $productionStart,
        public CarbonImmutable $end,
        public bool $isLate,
    ) {}
}
