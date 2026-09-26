<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * An instructor's profile: the demo's Create Instructor form (which also picks the user account), the
 * admin's edit form, and a user's own application to teach.
 */
class InstructorProfileRequest extends FormRequest
{
    /**
     * Admin routes check the admin role; the application route only needs a signed-in user.
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
        $isAdminCreate = $this->routeIs('admin.instructors.store');
        $isAdminEdit = $this->routeIs('admin.instructors.update');

        return [
            'user_id' => $isAdminCreate
                ? ['required', 'integer', Rule::exists('users', 'id'), Rule::unique('instructors', 'user_id')]
                : ['prohibited'],
            'name' => $isAdminEdit ? ['required', 'string', 'max:255'] : ['prohibited'],
            'title' => ['required', 'string', 'max:255'],
            'resume' => [$this->routeIs('instructor-application.store') ? 'required' : 'nullable', 'file', 'max:5120', 'mimes:pdf,doc,docx'],
            'skills' => ['array', 'max:20'],
            'skills.*' => ['string', 'distinct', 'max:60'],
            'biography' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'user_id' => __('user'),
            'title' => __('designation'),
        ];
    }

    /**
     * The profile fields to save; a new resume replaces the stored one.
     *
     * @return array<string, mixed>
     */
    public function profile(): array
    {
        $attributes = [
            'title' => $this->validated('title'),
            'skills' => array_values(array_filter(array_map('trim', $this->validated('skills') ?? []))),
            'biography' => $this->validated('biography'),
        ];

        if ($this->hasFile('resume')) {
            $attributes['resume_path'] = $this->file('resume')->store('resumes', 'local');
            $attributes['resume_name'] = $this->file('resume')->getClientOriginalName();
        }

        return $attributes;
    }
}
