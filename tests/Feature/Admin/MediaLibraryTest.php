<?php

namespace Tests\Feature\Admin;

use App\Models\Media;
use App\Models\MediaFolder;
use App\Models\User;
use Database\Seeders\AdminSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MediaLibraryTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        $this->seed(AdminSeeder::class);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_files_are_uploaded_sorted_by_kind_and_counted_per_folder()
    {
        $folder = MediaFolder::create(['name' => 'Covers']);

        $this->actingAs($this->admin)->post(route('admin.media.store'), [
            'files' => [UploadedFile::fake()->image('ayurveda.jpg'), UploadedFile::fake()->create('notes.pdf', 50, 'application/pdf')],
            'folder_id' => $folder->id,
        ])->assertSessionHasNoErrors();
        $this->post(route('admin.media.store'), ['files' => [UploadedFile::fake()->create('clip.mp4', 100, 'video/mp4')]]);

        $image = Media::firstWhere('name', 'ayurveda');
        $this->assertSame(['image', $folder->id], [$image->kind, $image->media_folder_id]);
        Storage::disk('public')->assertExists($image->path);

        $this->get(route('admin.media.index', ['folder' => $folder->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/media/index')
                ->where('counts.all', 2)
                ->where('counts.image', 1)
                ->where('counts.document', 1)
                ->where('media.data.0.url', Storage::disk('public')->url(Media::firstWhere('name', 'notes')->path)));

        $this->get(route('admin.media.index', ['kind' => 'video']))->assertInertia(fn (Assert $page) => $page->where('media.total', 1));

        $this->post(route('admin.media.store'), ['files' => [UploadedFile::fake()->create('virus.exe', 10)]])->assertSessionHasErrors('files.0');
    }

    public function test_selected_files_are_deleted_with_their_stored_file_and_folders_keep_files()
    {
        $this->actingAs($this->admin)->post(route('admin.media.store'), ['files' => [UploadedFile::fake()->image('a.png'), UploadedFile::fake()->image('b.png')]]);
        [$first, $second] = Media::orderBy('id')->get();

        $this->delete(route('admin.media.destroy'), ['ids' => [$first->id]])->assertSessionHasNoErrors();
        $this->assertModelMissing($first);
        Storage::disk('public')->assertMissing($first->path);

        $this->post(route('admin.media.folders.store'), ['name' => 'Old']);
        $folder = MediaFolder::firstWhere('name', 'Old');
        $this->patch(route('admin.media.update', $second), ['media_folder_id' => $folder->id]);
        $this->delete(route('admin.media.folders.destroy', $folder));
        $this->assertNull($second->fresh()->media_folder_id);

        $this->actingAs(User::factory()->create())->get(route('admin.media.index'))->assertForbidden();
    }
}
