<?php

namespace App\Http\Requests\Admin;

use App\Support\VideoEmbed;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCourseRequest extends FormRequest
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
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')->where(fn ($query) => $query->whereNull('parent_id'))],
            'subcategory_id' => ['nullable', 'integer', Rule::exists('categories', 'id')->where(fn ($query) => $query->where('parent_id', $this->integer('category_id')))],
            'level' => ['required', Rule::in(['beginner', 'intermediate', 'advanced'])],
            'language' => ['required', Rule::in(array_keys(config('lms.course_languages')))],
            'pricing_type' => ['required', Rule::in(['free', 'paid'])],
            'price' => [Rule::requiredIf($isPaid), 'nullable', 'numeric', 'min:0.01', 'max:99999'],
            'discount' => ['boolean'],
            'discount_price' => [Rule::requiredIf($isPaid && $this->boolean('discount')), 'nullable', 'numeric', 'min:0', 'lt:price'],
            'expiry_type' => ['required', Rule::in(['lifetime', 'limited_time'])],
            'expiry_months' => ['required_if:expiry_type,limited_time', 'nullable', 'integer', 'min:1', 'max:120'],
            'thumbnail' => ['nullable', 'image', 'max:2048'],
            'remove_thumbnail' => ['boolean'],
            'banner' => ['nullable', 'image', 'max:4096'],
            'remove_banner' => ['boolean'],
            'preview_type' => ['nullable', Rule::in(['video_url', 'video'])],
            'preview_url' => ['exclude_unless:preview_type,video_url', 'nullable', 'url:https', 'max:2048', 'regex:'.VideoEmbed::PATTERN],
            'preview_file' => ['exclude_unless:preview_type,video', 'nullable', 'file', 'mimes:mp4,webm,mov', 'max:46080'],
            'drip_content' => ['required', 'boolean'],
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
    public function messages(): array
    {
        return [
            'preview_url.regex' => __('Use a YouTube or Vimeo link.'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'instructor_id' => __('course instructor'),
            'category_id' => __('category'),
            'subcategory_id' => __('subcategory'),
            'discount_price' => __('discounted price'),
            'expiry_months' => __('expiry period'),
            'preview_url' => __('preview video'),
            'preview_file' => __('preview video'),
        ];
    }
}
