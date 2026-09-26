<?php

namespace App\Enums;

/**
 * What a lesson holds, chosen in the Add lesson dialog. File types are stored privately and served
 * through the course player.
 */
enum LessonContentType: string
{
    case Video = 'video';
    case VideoUrl = 'video_url';
    case Document = 'document';
    case Image = 'image';
    case Text = 'text';
    case Embed = 'embed';

    public function isFile(): bool
    {
        return in_array($this, [self::Video, self::Document, self::Image], true);
    }

    /**
     * Upload rules for file types: allowed extensions and maximum size in kilobytes. Video stays under
     * PHP's upload_max_filesize (48M here); raise both together for bigger files.
     *
     * @return list<string>
     */
    public function fileRules(): array
    {
        return match ($this) {
            self::Video => ['mimes:mp4,webm,mov', 'max:46080'],
            self::Document => ['mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,txt', 'max:20480'],
            self::Image => ['mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            default => [],
        };
    }
}
