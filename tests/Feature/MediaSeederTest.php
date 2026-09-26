<?php

namespace Tests\Feature;

use App\Models\Media;
use Database\Seeders\MediaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_copies_the_site_images_into_the_library_once()
    {
        Storage::fake('public');

        $this->seed(MediaSeeder::class);
        $count = Media::count();
        $this->seed(MediaSeeder::class);

        $this->assertGreaterThan(0, $count);
        $this->assertSame($count, Media::count());
        Storage::disk('public')->assertExists(Media::first()->path);
    }
}
