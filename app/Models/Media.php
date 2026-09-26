<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

/**
 * A file in the Media Library, stored on the public disk so its link can be copied and used anywhere.
 *
 * @property int $id
 * @property int|null $user_id Who uploaded it (instructors see only their own).
 * @property int|null $media_folder_id
 * @property string $name
 * @property string $path
 * @property string $mime_type
 * @property string $kind image|video|document|compressed
 * @property int $size Bytes.
 * @property-read string $url
 */
#[Fillable(['user_id', 'media_folder_id', 'name', 'path', 'mime_type', 'kind', 'size'])]
#[Appends(['url'])]
class Media extends Model
{
    public const KINDS = ['video', 'image', 'document', 'compressed'];

    /**
     * Allowed upload extensions for each kind.
     *
     * @var array<string, list<string>>
     */
    public const EXTENSIONS = [
        'image' => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        'video' => ['mp4', 'webm', 'mov'],
        'document' => ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'epub'],
        'compressed' => ['zip', 'rar', '7z'],
    ];

    protected static function booted(): void
    {
        static::deleted(fn (Media $media) => Storage::disk('public')->delete($media->path));
    }

    /**
     * @return Attribute<string, never>
     */
    protected function url(): Attribute
    {
        return Attribute::get(fn () => Storage::disk('public')->url($this->path));
    }

    public static function kindOf(string $extension): ?string
    {
        foreach (self::EXTENSIONS as $kind => $extensions) {
            if (in_array(strtolower($extension), $extensions, true)) {
                return $kind;
            }
        }

        return null;
    }
}
