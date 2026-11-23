<?php

namespace App\Models;

use Database\Factories\MachineFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A production line, shown as one row on the timeline. Not linked to other tables.
 */
#[Fillable(['name'])]
class Machine extends Model
{
    /** @use HasFactory<MachineFactory> */
    use HasFactory;
}
