<?php

namespace App\Http\Requests\Admin;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * The Create Exam form, and the exam editor's Basic, Pricing, Settings, Media and SEO tabs (each save
 * sends the whole form).
 */
class StoreExamRequest extends FormRequest
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
            'short_description' => ['nullable', 'string', 'max:1000'],
            'description' => ['nullable', 'string', 'max:200000'],
            'instructor_id' => ['required', 'integer', Rule::exists('instructors', 'id')],
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')],
            'level' => ['required', Rule::in(['beginner', 'intermediate', 'advanced'])],
            'duration_hours' => ['required', 'integer', 'min:0', 'max:23'],
            'duration_minutes' => ['required', 'integer', 'min:0', 'max:59'],
            'pass_percentage' => ['required', 'integer', 'min:1', 'max:100'],
            'max_attempts' => ['required', 'integer', 'min:1', 'max:100'],
            'total_marks' => ['required', 'integer', 'min:1', 'max:10000'],
            'pricing_type' => ['required', Rule::in(['free', 'paid'])],
            'price' => [Rule::requiredIf($isPaid), 'nullable', 'numeric', 'min:0.01', 'max:99999'],
            'discount' => ['boolean'],
            'discount_price' => [Rule::requiredIf($isPaid && $this->boolean('discount')), 'nullable', 'numeric', 'min:0', 'lt:price'],
            'expiry_type' => ['required', Rule::in(['lifetime', 'limited_time'])],
            'expiry_months' => ['required_if:expiry_type,limited_time', 'nullable', 'integer', 'min:1', 'max:120'],
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
     * An exam needs a time limit.
     *
     * @return list<Closure(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if (! $validator->errors()->hasAny(['duration_hours', 'duration_minutes'])
                && $this->integer('duration_hours') === 0 && $this->integer('duration_minutes') === 0) {
                $validator->errors()->add('duration_minutes', __('Set a duration for the exam.'));
            }
        }];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'instructor_id' => __('exam instructor'),
            'category_id' => __('category'),
            'pass_percentage' => __('pass mark'),
            'discount_price' => __('discounted price'),
            'expiry_months' => __('expiry period'),
        ];
    }
}
