<?php

namespace Tests\Feature\Admin;

use App\Enums\LessonContentType;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LessonContentTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Course $course;

    private CourseSection $section;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        $this->seed(LandingSeeder::class);
        $this->admin = User::factory()->admin()->create();
        $this->course = Course::orderBy('id')->firstOrFail();
        $this->section = $this->course->sections()->create(['title' => 'Basics', 'position' => 1]);
    }

    public function test_a_video_file_lesson_is_stored_privately_and_replaced_or_kept_on_edit()
    {
        $this->addLesson(['content_type' => 'video', 'file' => UploadedFile::fake()->create('intro.mp4', 500, 'video/mp4')])
            ->assertSessionHasNoErrors();

        $lesson = $this->section->lessons()->firstOrFail();
        $first = $lesson->source;
        $this->assertSame(LessonContentType::Video, $lesson->content_type);
        Storage::disk('local')->assertExists($first);

        $this->updateLesson($lesson, ['content_type' => 'video', 'title' => 'Renamed'])->assertSessionHasNoErrors();
        $this->assertSame($first, $lesson->refresh()->source);

        $this->updateLesson($lesson, ['content_type' => 'video', 'file' => UploadedFile::fake()->create('new.mp4', 500, 'video/mp4')]);
        Storage::disk('local')->assertMissing($first);
        Storage::disk('local')->assertExists($lesson->refresh()->source);

        $this->updateLesson($lesson, ['content_type' => 'video_url', 'url' => 'https://youtu.be/dQw4w9WgXcQ'])->assertSessionHasNoErrors();
        Storage::disk('local')->assertDirectoryEmpty("lessons/{$this->course->id}");
        $this->assertSame('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', $lesson->refresh()->videoEmbedUrl());
    }

    public function test_files_are_deleted_with_their_section()
    {
        $this->addLesson(['content_type' => 'image', 'file' => UploadedFile::fake()->image('chart.png')]);
        $path = $this->section->lessons()->firstOrFail()->source;

        $this->actingAs($this->admin)->delete(route('admin.courses.sections.destroy', [$this->course, $this->section]));

        Storage::disk('local')->assertMissing($path);
    }

    public function test_each_type_requires_its_own_content()
    {
        $this->addLesson(['content_type' => 'video'])->assertSessionHasErrors('file');
        $this->addLesson(['content_type' => 'image', 'file' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf')])->assertSessionHasErrors('file');
        $this->addLesson(['content_type' => 'video_url', 'url' => 'https://example.com/page'])->assertSessionHasErrors('url');
        $this->addLesson(['content_type' => 'embed', 'url' => 'http://insecure.test'])->assertSessionHasErrors('url');
        $this->addLesson(['content_type' => 'text', 'body' => ''])->assertSessionHasErrors('body');

        $this->assertSame(0, $this->section->lessons()->count());
    }

    public function test_text_lessons_are_sanitized()
    {
        $this->addLesson(['content_type' => 'text', 'body' => '<p>Hi<script>alert(1)</script></p>'])->assertSessionHasNoErrors();

        $this->assertSame('<p>Hi</p>', $this->section->lessons()->firstOrFail()->body);
    }

    public function test_lesson_files_are_only_served_to_people_allowed_in_the_player()
    {
        $this->addLesson(['content_type' => 'document', 'file' => UploadedFile::fake()->create('guide.pdf', 50, 'application/pdf')]);
        $lesson = $this->section->lessons()->firstOrFail();
        $url = route('courses.learn.file', [$this->course, $lesson]);

        $this->actingAs(User::factory()->create())->get($url)->assertForbidden();

        $student = User::factory()->create();
        Enrollment::create(['user_id' => $student->id, 'course_id' => $this->course->id, 'price_paid' => 0]);
        $this->actingAs($student)->get($url)->assertOk();

        $this->actingAs($student)
            ->get(route('courses.learn', [$this->course, $lesson]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('current.src', $url)
                ->where('current.file_extension', 'pdf'));
    }

    public function test_links_and_files_can_be_attached_as_resources_and_are_cleaned_up()
    {
        $this->addLesson(['content_type' => 'embed', 'url' => 'https://example.com/sim']);
        $lesson = $this->section->lessons()->firstOrFail();
        $store = route('admin.courses.lessons.resources.store', [$this->course, $lesson]);

        $this->actingAs($this->admin)->post($store, ['title' => 'Guideline', 'type' => 'link', 'url' => 'https://www.who.int'])->assertSessionHasNoErrors();
        $this->actingAs($this->admin)->post($store, ['title' => 'Worksheet', 'type' => 'file', 'file' => UploadedFile::fake()->create('sheet.pdf', 20, 'application/pdf')])->assertSessionHasNoErrors();
        $this->actingAs($this->admin)->post($store, ['title' => 'Bad', 'type' => 'link', 'url' => 'javascript:alert(1)'])->assertSessionHasErrors('url');

        [$link, $file] = $lesson->resources()->orderBy('id')->get();
        Storage::disk('local')->assertExists($file->resource);

        $student = User::factory()->create();
        $download = route('courses.learn.resource', [$this->course, $lesson, $file]);
        $this->actingAs($student)->get($download)->assertForbidden();
        Enrollment::create(['user_id' => $student->id, 'course_id' => $this->course->id, 'price_paid' => 0]);
        $this->actingAs($student)->get($download)->assertOk();

        $this->actingAs($this->admin)->delete(route('admin.courses.lessons.resources.destroy', [$this->course, $lesson, $file]));
        Storage::disk('local')->assertMissing($file->resource);

        $this->actingAs($this->admin)->delete(route('admin.courses.lessons.destroy', [$this->course, $lesson]));
        $this->assertModelMissing($link);
    }

    public function test_quizzes_cannot_have_resources()
    {
        $quiz = $this->section->lessons()->create(['course_id' => $this->course->id, 'type' => 'quiz', 'title' => 'Quiz', 'position' => 1, 'duration_minutes' => 10]);

        $this->actingAs($this->admin)
            ->post(route('admin.courses.lessons.resources.store', [$this->course, $quiz]), ['title' => 'x', 'type' => 'link', 'url' => 'https://example.com'])
            ->assertNotFound();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function addLesson(array $data): TestResponse
    {
        return $this->actingAs($this->admin)->post(
            route('admin.courses.lessons.store', [$this->course, $this->section]),
            ['type' => 'lesson', 'title' => 'Lesson', 'duration_minutes' => 10, ...$data],
        );
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function updateLesson(Lesson $lesson, array $data): TestResponse
    {
        return $this->actingAs($this->admin)->put(
            route('admin.courses.lessons.update', [$this->course, $lesson]),
            ['title' => 'Lesson', 'duration_minutes' => 10, ...$data],
        );
    }
}
