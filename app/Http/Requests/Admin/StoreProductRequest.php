<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The Create Product form, and the product editor's Basic, Pricing, Media and SEO tabs (each save sends
 * the whole form).
 */
class StoreProductRequest extends FormRequest
{
    /**
     * Only admins reach this route (role:admin middleware).
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
        $isPaid = $this->input('pricing_type') === 'paid';

        return [
            'title' => ['required', 'string', 'max:255'],
            'summary' => ['required', 'string', 'max:1000'],
            'description' => ['nullable', 'string', 'max:200000'],
            'instructor_id' => ['required', 'integer', Rule::exists('instructors', 'id')],
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')],
            'type' => ['required', 'string', 'max:60'],
            'format' => ['nullable', 'string', 'max:120'],
            'pricing_type' => ['required', Rule::in(['free', 'paid'])],
            'price' => [Rule::requiredIf($isPaid), 'nullable', 'numeric', 'min:0.01', 'max:99999'],
            'discount' => ['boolean'],
            'discount_price' => [Rule::requiredIf($isPaid && $this->boolean('discount')), 'nullable', 'numeric', 'min:0', 'lt:price'],
            'unlimited_stock' => ['boolean'],
            'stock' => [Rule::requiredIf(! $this->boolean('unlimited_stock')), 'nullable', 'integer', 'min:0', 'max:1000000'],
            'thumbnail' => ['nullable', 'image', 'max:2048'],
            'remove_thumbnail' => ['boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_keywords' => ['nullable', 'string', 'max:1000'],
            'meta_description' => ['nullable', 'string', 'max:1000'],
            'og_title' => ['nullable', 'string', 'max:255'],
            'og_description' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'instructor_id' => __('instructor'),
            'category_id' => __('category'),
            'discount_price' => __('discounted price'),
        ];
    }
}
