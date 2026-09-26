<?php

namespace App\Models;

use App\Enums\LessonContentType;
use App\Enums\LessonType;
use App\Support\VideoEmbed;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

/**
 * One curriculum item (a lesson or a quiz) in a course section, ordered by position.
 *
 * @property int $id
 * @property int $course_id
 * @property int|null $course_section_id
 * @property LessonType $type
 * @property LessonContentType|null $content_type
 * @property string|null $source Private file path for file types, otherwise the video or embed URL.
 * @property string|null $body Sanitized HTML for text lessons.
 * @property string|null $description
 * @property string $title
 * @property int $position
 * @property int $duration_minutes
 * @property int|null $time_limit_seconds Quiz time limit.
 * @property int|null $total_mark
 * @property int|null $pass_mark
 * @property int|null $retake_attempts
 */
#[Fillable(['course_id', 'course_section_id', 'type', 'content_type', 'source', 'body', 'description', 'title', 'position', 'duration_minutes', 'time_limit_seconds', 'total_mark', 'pass_mark', 'retake_attempts'])]
class Lesson extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => LessonType::class,
            'content_type' => LessonContentType::class,
        ];
    }

    /**
     * Remove uploaded files (the lesson's own and its resources') along with the lesson.
     */
    protected static function booted(): void
    {
        static::deleting(fn (Lesson $lesson) => $lesson->resources()->get()->each->delete());
        static::deleted(fn (Lesson $lesson) => $lesson->deleteFile());
    }

    public function hasFile(): bool
    {
        return $this->content_type?->isFile() === true && $this->source !== null;
    }

    public function deleteFile(): void
    {
        if ($this->hasFile()) {
            Storage::disk('local')->delete($this->source);
        }
    }

    /**
     * Player URL for a video link: a YouTube or Vimeo embed, or the link itself for a direct video file.
     */
    public function videoEmbedUrl(): ?string
    {
        if ($this->content_type !== LessonContentType::VideoUrl || ! $this->source) {
            return null;
        }

        return VideoEmbed::url($this->source) ?? $this->source;
    }

    /**
     * Lessons only, without quizzes.
     *
     * @param  Builder<Lesson>  $query
     */
    public function scopeLessonsOnly(Builder $query): void
    {
        $query->where('type', LessonType::Lesson);
    }

    /**
     * @return HasMany<LessonResource, $this>
     */
    public function resources(): HasMany
    {
        return $this->hasMany(LessonResource::class);
    }

    /**
     * A quiz's questions (they share the exam question table).
     *
     * @return HasMany<ExamQuestion, $this>
     */
    public function questions(): HasMany
    {
        return $this->hasMany(ExamQuestion::class)->orderBy('position')->orderBy('id');
    }

    /**
     * @return BelongsTo<Course, $this>
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * @return BelongsTo<CourseSection, $this>
     */
    public function section(): BelongsTo
    {
        return $this->belongsTo(CourseSection::class, 'course_section_id');
    }
}
