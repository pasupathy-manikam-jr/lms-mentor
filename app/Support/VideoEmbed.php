<?php

namespace App\Support;

/**
 * Turns YouTube and Vimeo page links into their embeddable player URLs.
 */
class VideoEmbed
{
    /**
     * Matches links this class can embed; used to validate video URLs.
     */
    public const PATTERN = '~(youtube\.com|youtu\.be|vimeo\.com)~i';

    public static function url(string $link): ?string
    {
        if (preg_match('~(?:youtube\.com/(?:watch\?(?:.*&)?v=|embed/|shorts/)|youtu\.be/)([\w-]{11})~', $link, $match)) {
            return "https://www.youtube-nocookie.com/embed/{$match[1]}";
        }

        if (preg_match('~vimeo\.com/(?:video/)?(\d+)~', $link, $match)) {
            return "https://player.vimeo.com/video/{$match[1]}";
        }

        return null;
    }
}
