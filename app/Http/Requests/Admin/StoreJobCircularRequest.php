<?php

namespace App\Http\Requests\Admin;

use App\Models\JobOpening;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The Create Circular and Edit Job forms, following the Mentor demo.
 */
class StoreJobCircularRequest extends FormRequest
{
    /**
     * The currencies the salary can be listed in.
     *
     * @var list<string>
     */
    public const CURRENCIES = ['INR', 'MYR', 'CNY', 'SGD', 'USD', 'EUR', 'GBP', 'AED'];

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
        $hasSalary = ! $this->boolean('negotiable');

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash:ascii', Rule::unique('job_openings', 'slug')->ignore($this->route('jobOpening'))],
            'description' => ['required', 'string', 'max:100000'],
            'status' => ['required', Rule::in(JobOpening::STATUSES)],
            'apply_email' => ['required', 'email', 'max:255'],
            'job_type' => ['required', Rule::in(JobOpening::JOB_TYPES)],
            'work_type' => ['required', Rule::in(JobOpening::WORK_TYPES)],
            'experience_level' => ['required', Rule::in(JobOpening::EXPERIENCE_LEVELS)],
            'positions' => ['required', 'integer', 'min:1', 'max:1000'],
            'location' => ['required', 'string', 'max:255'],
            'deadline' => ['required', 'date'],
            'skills' => ['array', 'max:20'],
            'skills.*' => ['string', 'distinct', 'max:60'],
            'negotiable' => ['boolean'],
            'currency' => ['required', Rule::in(self::CURRENCIES)],
            'salary_min' => [Rule::requiredIf($hasSalary), 'nullable', 'integer', 'min:0', 'max:100000000'],
            'salary_max' => [Rule::requiredIf($hasSalary), 'nullable', 'integer', 'gte:salary_min', 'max:100000000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'apply_email' => __('contact email'),
            'salary_min' => __('minimum salary'),
            'salary_max' => __('maximum salary'),
            'positions' => __('positions available'),
            'deadline' => __('application deadline'),
        ];
    }
}
