<?php

namespace Tests\Feature\Admin;

use App\Enums\CourseStatus;
use App\Enums\LessonType;
use App\Models\Course;
use App\Models\CourseSection;
use App\Models\User;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CourseEditorTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(LandingSeeder::class);
        $this->admin = User::factory()->admin()->create();
        $this->course = Course::orderBy('id')->firstOrFail();
    }

    public function test_the_editor_shows_the_course_its_curriculum_and_the_discount_as_entered()
    {
        $this->course->update(['price' => 29.99, 'compare_at_price' => 49.99]);
        $section = $this->course->sections()->create(['title' => 'Introduction', 'position' => 1]);
        $section->lessons()->create(['course_id' => $this->course->id, 'title' => 'Welcome', 'position' => 1, 'duration_minutes' => 5]);

        $this->actingAs($this->admin)
            ->get(route('admin.courses.edit', $this->course))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/courses/edit')
                ->where('course.title', $this->course->title)
                ->where('course.pricing_type', 'paid')
                ->where('course.price', '49.99')
                ->where('course.discount', true)
                ->where('course.discount_price', '29.99')
                ->where('slug', $this->course->slug)
                ->where('sections.0.title', 'Introduction')
                ->where('sections.0.lessons.0.title', 'Welcome'));
    }

    public function test_saving_changes_keeps_the_slug_status_and_thumbnail()
    {
        $original = $this->course->only(['slug', 'status', 'image_url']);

        $this->actingAs($this->admin)
            ->from(route('admin.courses.edit', $this->course))
            ->put(route('admin.courses.update', $this->course), [
                'title' => 'Renamed Course',
                'short_description' => 'New summary.',
                'description' => '<p>Body</p>',
                'instructor_id' => $this->course->instructor_id,
                'category_id' => $this->course->category_id,
                'level' => 'advanced',
                'language' => 'ms',
                'pricing_type' => 'free',
                'expiry_type' => 'lifetime',
                'drip_content' => '1',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect(route('admin.courses.edit', $this->course));

        $this->course->refresh();

        $this->assertSame('Renamed Course', $this->course->title);
        $this->assertSame('ms', $this->course->language);
        $this->assertSame('0.00', $this->course->price);
        $this->assertTrue($this->course->drip_content);
        $this->assertSame($original, $this->course->only(['slug', 'status', 'image_url']));
    }

    public function test_media_tab_saves_banner_and_preview_and_cleans_up_replaced_uploads()
    {
        Storage::fake('public');
        $this->actingAs($this->admin);
        $save = fn (array $media) => $this->put(route('admin.courses.update', $this->course), [...$this->basicPayload(), ...$media]);

        $save(['banner' => UploadedFile::fake()->image('banner.jpg'), 'preview_type' => 'video_url', 'preview_url' => 'https://youtu.be/dQw4w9WgXcQ'])->assertSessionHasNoErrors();
        $this->course->refresh();
        $banner = $this->course->banner_url;
        $this->assertSame(['video_url', 'https://youtu.be/dQw4w9WgXcQ'], [$this->course->preview_type, $this->course->preview_source]);
        $this->assertNotNull($this->course->image_url, 'untouched thumbnail is kept');

        $save(['preview_type' => 'video', 'preview_file' => UploadedFile::fake()->create('trailer.mp4', 300, 'video/mp4')])->assertSessionHasNoErrors();
        $video = $this->course->refresh()->preview_source;
        Storage::disk('public')->assertExists(str_replace('/storage/', '', parse_url($video, PHP_URL_PATH)));
        $this->assertSame($banner, $this->course->banner_url, 'banner kept when not sent');

        $save(['preview_type' => 'video_url', 'preview_url' => '', 'remove_banner' => true])->assertSessionHasNoErrors();
        $this->course->refresh();
        $this->assertNull($this->course->preview_type);
        $this->assertNull($this->course->banner_url);
        Storage::disk('public')->assertMissing(str_replace('/storage/', '', parse_url($video, PHP_URL_PATH)));
        Storage::disk('public')->assertMissing(str_replace('/storage/', '', parse_url($banner, PHP_URL_PATH)));

        $save(['preview_type' => 'video_url', 'preview_url' => 'https://example.com/clip'])->assertSessionHasErrors('preview_url');

        $this->course->update(['status' => CourseStatus::Approved, 'preview_type' => 'video_url', 'preview_source' => 'https://vimeo.com/76979871']);
        $this->get(route('courses.show', $this->course->slug))
            ->assertInertia(fn (Assert $page) => $page->where('preview.src', 'https://player.vimeo.com/video/76979871'));
    }

    public function test_seo_fields_are_saved_and_shown_to_the_course_page()
    {
        $this->actingAs($this->admin)
            ->put(route('admin.courses.update', $this->course), [...$this->basicPayload(), 'meta_title' => 'Learn management in healthcare', 'meta_description' => 'A short course for ward leaders.', 'og_title' => 'Management for clinicians'])
            ->assertSessionHasNoErrors();

        $this->course->refresh();
        $this->assertSame('Learn management in healthcare', $this->course->meta_title);

        $this->get(route('admin.courses.edit', $this->course))
            ->assertInertia(fn (Assert $page) => $page->where('course.og_title', 'Management for clinicians')->where('course.meta_keywords', ''));

        $this->course->update(['status' => CourseStatus::Approved]);
        $this->get(route('courses.show', $this->course->slug))
            ->assertInertia(fn (Assert $page) => $page->where('course.meta_description', 'A short course for ward leaders.'));
    }

    /**
     * @return array<string, mixed>
     */
    private function basicPayload(): array
    {
        return [
            'title' => $this->course->title, 'instructor_id' => $this->course->instructor_id, 'category_id' => $this->course->category_id,
            'level' => 'beginner', 'language' => 'en', 'pricing_type' => 'free', 'expiry_type' => 'lifetime', 'drip_content' => '0',
        ];
    }

    public function test_sections_and_lessons_can_be_added_edited_sorted_and_deleted()
    {
        $this->actingAs($this->admin);

        $this->post(route('admin.courses.sections.store', $this->course), ['title' => 'Basics'])->assertSessionHasNoErrors();
        $this->post(route('admin.courses.sections.store', $this->course), ['title' => 'Advanced'])->assertSessionHasNoErrors();
        [$basics, $advanced] = $this->course->sections()->get();

        $this->put(route('admin.courses.sections.update', [$this->course, $basics]), ['title' => 'Foundations']);
        $this->put(route('admin.courses.sections.sort', $this->course), ['ids' => [$advanced->id, $basics->id]]);

        $this->assertSame(['Advanced', 'Foundations'], $this->course->sections()->pluck('title')->all());

        $this->post(route('admin.courses.lessons.store', [$this->course, $basics]), ['type' => 'lesson', 'content_type' => 'embed', 'url' => 'https://example.com/sim', 'title' => 'Vital signs', 'duration_minutes' => 20]);
        $this->post(route('admin.courses.lessons.store', [$this->course, $advanced]), ['type' => 'lesson', 'content_type' => 'embed', 'url' => 'https://example.com/sim', 'title' => 'Case review', 'duration_minutes' => 40]);
        $this->assertSame(60, $this->course->refresh()->duration_minutes);

        $lesson = $basics->lessons()->firstOrFail();
        $this->put(route('admin.courses.lessons.update', [$this->course, $lesson]), ['content_type' => 'embed', 'url' => 'https://example.com/sim', 'title' => 'Vital signs', 'duration_minutes' => 30]);
        $this->assertSame(70, $this->course->refresh()->duration_minutes);

        $this->delete(route('admin.courses.sections.destroy', [$this->course, $advanced]));
        $this->assertDatabaseMissing('lessons', ['title' => 'Case review']);
        $this->assertSame(30, $this->course->refresh()->duration_minutes);

        $this->delete(route('admin.courses.lessons.destroy', [$this->course, $lesson]));
        $this->assertSame(0, $this->course->refresh()->duration_minutes);
    }

    public function test_quizzes_sit_beside_lessons_can_be_reordered_and_do_not_count_as_lesson_time()
    {
        $this->actingAs($this->admin);
        $section = $this->course->sections()->create(['title' => 'Basics', 'position' => 1]);

        $this->post(route('admin.courses.lessons.store', [$this->course, $section]), ['type' => 'lesson', 'content_type' => 'embed', 'url' => 'https://example.com/sim', 'title' => 'Welcome', 'duration_minutes' => 15])->assertSessionHasNoErrors();
        $this->post(route('admin.courses.lessons.store', [$this->course, $section]), $this->quiz(['title' => 'Basics quiz', 'minutes' => 20]))->assertSessionHasNoErrors();
        $this->post(route('admin.courses.lessons.store', [$this->course, $section]), ['type' => 'exam', 'title' => 'Nope', 'duration_minutes' => 5])->assertSessionHasErrors('type');

        $this->assertSame(15, $this->course->refresh()->duration_minutes);

        [$lesson, $quiz] = $section->lessons()->get();
        $this->put(route('admin.courses.lessons.sort', [$this->course, $section]), ['ids' => [$quiz->id, $lesson->id]])->assertSessionHasNoErrors();

        $this->assertSame(['Basics quiz', 'Welcome'], $section->lessons()->pluck('title')->all());
        $this->assertSame(LessonType::Quiz, $section->lessons()->first()->type);
    }

    public function test_a_quiz_stores_its_time_limit_marks_retakes_and_a_clean_summary()
    {
        $this->actingAs($this->admin);
        $section = $this->course->sections()->create(['title' => 'Basics', 'position' => 1]);

        $this->post(route('admin.courses.lessons.store', [$this->course, $section]), $this->quiz([
            'hours' => 1, 'minutes' => 2, 'seconds' => 30,
            'summary' => '<p>Read carefully<script>x()</script></p>',
        ]))->assertSessionHasNoErrors();

        $quiz = $section->lessons()->firstOrFail();
        $this->assertSame(LessonType::Quiz, $quiz->type);
        $this->assertSame(3750, $quiz->time_limit_seconds);
        $this->assertSame(63, $quiz->duration_minutes);
        $this->assertSame([100, 70, 3], [$quiz->total_mark, $quiz->pass_mark, $quiz->retake_attempts]);
        $this->assertSame('<p>Read carefully</p>', $quiz->body);

        $this->put(route('admin.courses.lessons.update', [$this->course, $quiz]), $this->quiz(['title' => 'Renamed quiz']))
            ->assertSessionHasNoErrors();
        $this->assertSame('Renamed quiz', $quiz->refresh()->title);
    }

    public function test_a_quiz_needs_a_time_limit_and_a_pass_mark_within_the_total()
    {
        $this->actingAs($this->admin);
        $section = $this->course->sections()->create(['title' => 'Basics', 'position' => 1]);

        $this->post(route('admin.courses.lessons.store', [$this->course, $section]), $this->quiz([
            'minutes' => 0, 'pass_mark' => 120, 'retake_attempts' => 0,
        ]))->assertSessionHasErrors(['minutes', 'pass_mark', 'retake_attempts']);

        $this->assertSame(0, $section->lessons()->count());
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function quiz(array $overrides = []): array
    {
        return [
            'type' => 'quiz', 'title' => 'Quiz', 'hours' => 0, 'minutes' => 30, 'seconds' => 0,
            'total_mark' => 100, 'pass_mark' => 70, 'retake_attempts' => 3, 'summary' => '',
            ...$overrides,
        ];
    }

    public function test_sections_of_another_course_cannot_be_touched_and_sorting_needs_every_section()
    {
        $other = Course::whereKeyNot($this->course->id)->firstOrFail();
        $foreign = CourseSection::create(['course_id' => $other->id, 'title' => 'Theirs', 'position' => 1]);
        $mine = $this->course->sections()->create(['title' => 'Mine', 'position' => 1]);
        $this->course->sections()->create(['title' => 'Also mine', 'position' => 2]);

        $this->actingAs($this->admin)
            ->put(route('admin.courses.sections.update', [$this->course, $foreign]), ['title' => 'Hijacked'])
            ->assertNotFound();

        $this->actingAs($this->admin)
            ->put(route('admin.courses.sections.sort', $this->course), ['ids' => [$mine->id, $foreign->id]])
            ->assertSessionHasErrors('ids.1');

        $this->assertSame('Theirs', $foreign->refresh()->title);
    }

    public function test_students_cannot_use_the_editor()
    {
        $student = User::factory()->create();

        $this->actingAs($student)->get(route('admin.courses.edit', $this->course))->assertForbidden();
        $this->actingAs($student)->post(route('admin.courses.sections.store', $this->course), ['title' => 'x'])->assertForbidden();
    }

    public function test_admins_can_preview_an_unpublished_course_but_visitors_cannot()
    {
        $this->course->update(['status' => CourseStatus::Draft]);

        $this->get(route('courses.show', $this->course->slug))->assertNotFound();
        $this->actingAs($this->admin)->get(route('courses.show', $this->course->slug))->assertOk();
    }
}
