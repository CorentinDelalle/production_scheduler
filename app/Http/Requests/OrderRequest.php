<?php

namespace App\Http\Requests;

use App\Models\Order;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OrderRequest extends FormRequest
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
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')],
            'product_type_id' => ['required', 'integer', Rule::exists('product_types', 'id')],
            'need_by_date' => [
                'required',
                'date_format:Y-m-d',
                Rule::when($this->changesNeedByDate(), 'after_or_equal:'.$this->today()),
            ],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('products', 'id')->where('product_type_id', $this->input('product_type_id')),
            ],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
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
            'customer_id' => 'customer',
            'product_type_id' => 'product type',
            'need_by_date' => 'need-by date',
            'items' => 'products',
            'items.*.product_id' => 'product',
            'items.*.quantity' => 'quantity',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.*.product_id.distinct' => 'This product is already on the order.',
            'items.*.product_id.exists' => 'Choose a product of the selected type.',
            'need_by_date.after_or_equal' => 'The need-by date cannot be in the past.',
        ];
    }

    /**
     * A new order, or an update that changes the need-by date. An existing order whose date
     * has passed can still be edited as long as its date is kept.
     */
    private function changesNeedByDate(): bool
    {
        $order = $this->route('order');

        return ! $order instanceof Order || $order->need_by_date->toDateString() !== $this->input('need_by_date');
    }

    /**
     * Today's date in the schedule timezone, so "the past" matches the plan, not the server.
     */
    private function today(): string
    {
        return CarbonImmutable::now(config('app.schedule_timezone'))->toDateString();
    }
}
