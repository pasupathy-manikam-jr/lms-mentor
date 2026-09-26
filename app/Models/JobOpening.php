<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * A vacancy (the demo's "job circular") listed on the Careers page while active and before its
 * deadline. No salary range means the salary is negotiable.
 *
 * @property int $id
 * @property string $title
 * @property string $slug
 * @property string $status draft|active|closed
 * @property string $location
 * @property string $job_type
 * @property string $work_type
 * @property string $experience_level
 * @property int $positions
 * @property Carbon $deadline
 * @property string $description Sanitized rich-text HTML.
 * @property list<string> $skills
 * @property int|null $salary_min
 * @property int|null $salary_max
 * @property string $currency
 * @property string $apply_email
 */
#[Fillable([
    'title', 'slug', 'status', 'location', 'job_type', 'work_type', 'experience_level', 'positions', 'deadline',
    'description', 'skills', 'salary_min', 'salary_max', 'currency', 'apply_email',
])]
class JobOpening extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'deadline' => 'date:Y-m-d',
            'skills' => 'array',
        ];
    }

    public const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'freelance'];

    public const WORK_TYPES = ['on-site', 'remote', 'hybrid'];

    public const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'executive'];

    public const STATUSES = ['draft', 'active', 'closed'];

    /**
     * Only openings still taking applications: active, with the deadline today or later.
     *
     * @param  Builder<JobOpening>  $query
     */
    public function scopeOpen(Builder $query): void
    {
        $query->where('status', 'active')->whereDate('deadline', '>=', today());
    }
}
