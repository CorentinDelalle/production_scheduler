<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductTypeRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255', Rule::unique('product_types', 'name')->ignore($this->route('product_type'))],
            'units_per_hour' => ['required', 'integer', 'min:1', 'max:100000'],
            'changeover_minutes' => ['required', 'integer', 'min:0', 'max:1440'],
        ];
    }

    /**
     * Readable field names for the validation messages.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'units_per_hour' => 'speed',
            'changeover_minutes' => 'changeover time',
        ];
    }
}
