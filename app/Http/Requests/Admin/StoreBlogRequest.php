<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The Create Blog and Update Blog forms, following the Mentor demo.
 */
class StoreBlogRequest extends FormRequest
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
        return [
            'title' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'keywords' => ['nullable', 'string', 'max:1000'],
            'body' => ['required', 'string', 'max:200000'],
            'banner' => ['nullable', 'image', 'max:4096'],
            'remove_banner' => ['boolean'],
            'thumbnail' => ['nullable', 'image', 'max:2048'],
            'remove_thumbnail' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'category_id' => __('category'),
            'body' => __('description'),
        ];
    }
}
