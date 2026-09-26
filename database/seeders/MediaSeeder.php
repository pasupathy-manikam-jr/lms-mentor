<?php

namespace Database\Seeders;

use App\Models\Media;
use App\Models\MediaFolder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Fills the Media Library with the site's own AI-generated images (course covers and hero scenes),
 * copied onto the public disk in two folders. Files already in the library are skipped.
 */
class MediaSeeder extends Seeder
{
    public function run(): void
    {
        $sources = [
            'Course covers' => public_path('images/courses'),
            'Hero images' => public_path('images/hero'),
        ];

        foreach ($sources as $folderName => $directory) {
            if (! File::isDirectory($directory)) {
                continue;
            }

            $folder = MediaFolder::firstOrCreate(['name' => $folderName]);

            foreach (File::files($directory) as $file) {
                $name = Str::headline($file->getFilenameWithoutExtension());

                if (Media::where('media_folder_id', $folder->id)->where('name', $name)->exists()) {
                    continue;
                }

                $path = 'media/'.Str::slug($folderName).'/'.$file->getFilename();
                Storage::disk('public')->put($path, File::get($file->getPathname()));

                Media::create([
                    'media_folder_id' => $folder->id,
                    'name' => $name,
                    'path' => $path,
                    'mime_type' => File::mimeType($file->getPathname()) ?: 'image/webp',
                    'kind' => 'image',
                    'size' => $file->getSize(),
                ]);
            }
        }
    }
}
