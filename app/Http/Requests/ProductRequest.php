<?php

namespace App\Http\Requests;

use App\Models\Product;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255', Rule::unique('products', 'name')->ignore($this->route('product'))],
            'product_type_id' => [
                'required',
                'integer',
                Rule::exists('product_types', 'id'),
                $this->keepsTypeWhileOrdered(...),
            ],
        ];
    }

    /**
     * Every product of an order must match the order's type, so an ordered product keeps its type.
     */
    private function keepsTypeWhileOrdered(string $attribute, mixed $value, Closure $fail): void
    {
        $product = $this->route('product');

        if ($product instanceof Product
            && (int) $value !== $product->product_type_id
            && $product->orderItems()->exists()) {
            $fail('The product type can’t change while the product is on orders.');
        }
    }

    /**
     * Readable field names for the validation messages.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'product_type_id' => 'product type',
        ];
    }
}
