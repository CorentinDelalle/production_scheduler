<?php

namespace App\Concerns;

use Illuminate\Support\Str;

/**
 * Wording of the "can't be deleted" messages of the catalog.
 */
trait DescribesUsage
{
    /**
     * "3 orders and 2 products", skipping the zero counts.
     *
     * @param  array<string, int>  $counts  Singular label => count.
     */
    protected function describeUsage(array $counts): string
    {
        $parts = [];
        foreach ($counts as $label => $count) {
            if ($count > 0) {
                $parts[] = $count.' '.Str::plural($label, $count);
            }
        }

        return Str::of(implode(', ', $parts))->replaceLast(', ', ' and ')->toString();
    }
}
