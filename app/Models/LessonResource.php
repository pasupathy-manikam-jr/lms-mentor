<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * A link or file attached to a lesson, listed under it in the course player.
 *
 * @property int $id
 * @property int $lesson_id
 * @property string $title
 * @property string $type link|file
 * @property string $resource The URL for links, or the private file path for files.
 */
#[Fillable(['lesson_id', 'title', 'type', 'resource'])]
class LessonResource extends Model
{
    /**
     * Remove an uploaded file along with its resource.
     */
    protected static function booted(): void
    {
        static::deleted(function (LessonResource $resource) {
            if ($resource->isFile()) {
                Storage::disk('local')->delete($resource->resource);
            }
        });
    }

    public function isFile(): bool
    {
        return $this->type === 'file';
    }

    /**
     * @return BelongsTo<Lesson, $this>
     */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
