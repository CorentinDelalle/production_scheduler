<?php

namespace App\Http\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ScheduleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'start' => ['nullable', 'date_format:Y-m-d'],
        ];
    }

    /**
     * Midnight of the requested start day in the schedule timezone, today by default.
     */
    public function startDate(): CarbonImmutable
    {
        $timezone = config('app.schedule_timezone');
        $start = $this->validated('start');

        return $start === null
            ? CarbonImmutable::now($timezone)->startOfDay()
            : CarbonImmutable::parse($start, $timezone)->startOfDay();
    }
}
