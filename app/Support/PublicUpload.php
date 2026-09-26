<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Stores an upload on the public disk and returns its URL, the form image and media columns keep.
 */
class PublicUpload
{
    /**
     * Fails loudly when the disk refuses the file, rather than saving the disk's root URL as the image.
     */
    public static function url(UploadedFile $file, string $directory): string
    {
        $path = $file->store($directory, 'public');

        if ($path === false) {
            throw new RuntimeException("Could not store the upload in {$directory}.");
        }

        return Storage::disk('public')->url($path);
    }
}
