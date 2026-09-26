<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A scheduled live session of a course.
 *
 * @property int $id
 * @property int $course_id
 * @property string $topic
 * @property CarbonImmutable $starts_at
 * @property int $duration_minutes
 * @property string $meeting_url
 * @property string|null $notes
 */
#[Fillable(['course_id', 'topic', 'starts_at', 'duration_minutes', 'meeting_url', 'notes'])]
class LiveClass extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
        ];
    }

    /**
     * upcoming, live or ended, from the start time and duration.
     */
    public function status(): string
    {
        return match (true) {
            now()->lt($this->starts_at) => 'upcoming',
            now()->lt($this->starts_at->copy()->addMinutes($this->duration_minutes)) => 'live',
            default => 'ended',
        };
    }

    /**
     * The fields the editor and the player show.
     *
     * @return array<string, mixed>
     */
    public function toSchedule(): array
    {
        return [
            ...$this->only(['id', 'topic', 'duration_minutes', 'meeting_url', 'notes']),
            'starts_at' => $this->starts_at->toIso8601String(),
            'status' => $this->status(),
        ];
    }

    /**
     * @return BelongsTo<Course, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
