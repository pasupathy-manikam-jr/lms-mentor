<?php

namespace Tests\Feature\Admin;

use App\Enums\ExamStatus;
use App\Models\Category;
use App\Models\Exam;
use App\Models\Instructor;
use App\Models\User;
use Database\Seeders\ExamQuestionSeeder;
use Database\Seeders\ExamSeeder;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ManageExamsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([LandingSeeder::class, ExamSeeder::class, ExamQuestionSeeder::class]);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_the_exam_list_searches_filters_and_shows_real_question_counts()
    {
        Exam::orderBy('id')->first()->update(['status' => ExamStatus::Draft]);

        $this->actingAs($this->admin)
            ->get(route('admin.exams.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/exams/index')
                ->where('exams.total', 8)
                ->where('exams.data.0.questions_count', 10));

        $this->get(route('admin.exams.index', ['status' => 'draft']))
            ->assertInertia(fn (Assert $page) => $page->where('exams.total', 1));
        $this->get(route('admin.exams.index', ['search' => 'nutrition']))
            ->assertInertia(fn (Assert $page) => $page->where('exams.total', 1));
    }

    public function test_an_exam_is_created_as_a_draft_edited_and_published()
    {
        $this->actingAs($this->admin)
            ->post(route('admin.exams.store'), $this->payload())
            ->assertSessionHasNoErrors();

        $exam = Exam::where('title', 'Ward Management Basics Test')->firstOrFail();
        $this->assertSame(ExamStatus::Draft, $exam->status);
        $this->assertSame(90, $exam->duration_minutes);
        $this->assertSame('ward-management-basics-test', $exam->slug);

        $this->get(route('exams.show', $exam->slug))->assertOk(); // admin preview

        $this->put(route('admin.exams.update', $exam), $this->payload(['pass_percentage' => 60, 'pricing_type' => 'paid', 'price' => 20, 'discount' => true, 'discount_price' => 15]))
            ->assertSessionHasNoErrors();
        $exam->refresh();
        $this->assertSame([60, '15.00', '20.00'], [$exam->pass_percentage, $exam->price, $exam->compare_at_price]);

        $this->patch(route('admin.exams.status', $exam), ['status' => 'published']);
        $this->assertSame(ExamStatus::Published, $exam->refresh()->status);
    }

    public function test_exams_need_a_duration_and_only_published_exams_are_public()
    {
        $this->actingAs($this->admin)
            ->post(route('admin.exams.store'), $this->payload(['duration_hours' => 0, 'duration_minutes' => 0]))
            ->assertSessionHasErrors('duration_minutes');

        $draft = Exam::orderBy('id')->firstOrFail();
        $draft->update(['status' => ExamStatus::Draft]);

        auth()->logout();
        $this->get(route('exams.show', $draft->slug))->assertNotFound();
        $this->get(route('exams.index'))->assertInertia(fn (Assert $page) => $page->where('exams.total', 7));
    }

    public function test_students_cannot_manage_exams()
    {
        $this->actingAs(User::factory()->create())->get(route('admin.exams.index'))->assertForbidden();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'title' => 'Ward Management Basics Test', 'short_description' => 'A short check.', 'description' => '<p>Body</p>',
            'instructor_id' => Instructor::value('id'), 'category_id' => Category::whereNull('parent_id')->value('id'), 'level' => 'beginner',
            'duration_hours' => 1, 'duration_minutes' => 30, 'pass_percentage' => 70, 'max_attempts' => 3, 'total_marks' => 20,
            'pricing_type' => 'free', 'expiry_type' => 'lifetime',
            ...$overrides,
        ];
    }
}
