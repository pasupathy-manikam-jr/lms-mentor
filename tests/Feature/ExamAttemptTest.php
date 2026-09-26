<?php

namespace Tests\Feature;

use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\User;
use Database\Seeders\CertificateTemplateSeeder;
use Database\Seeders\ExamSeeder;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExamAttemptTest extends TestCase
{
    use RefreshDatabase;

    private Exam $exam;

    private User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([LandingSeeder::class, ExamSeeder::class, CertificateTemplateSeeder::class]);
        $this->exam = Exam::published()->orderBy('id')->firstOrFail();
        $this->exam->update(['duration_minutes' => 30, 'pass_percentage' => 60, 'max_attempts' => 2]);
        $this->exam->questions()->delete();

        $question = fn (array $attributes) => $this->exam->questions()->create(['description' => null, 'options' => null, ...$attributes]);
        $question(['type' => 'multiple_choice', 'title' => 'Q1', 'options' => ['A', 'B', 'C'], 'answer' => [1], 'marks' => 2, 'position' => 1]);
        $question(['type' => 'multiple_select', 'title' => 'Q2', 'options' => ['A', 'B', 'C'], 'answer' => [0, 2], 'marks' => 2, 'position' => 2]);
        $question(['type' => 'fill_blank', 'title' => 'Q3', 'answer' => ['Vata', 'Vayu'], 'marks' => 2, 'position' => 3]);
        $question(['type' => 'ordering', 'title' => 'Q4', 'answer' => ['one', 'two', 'three'], 'marks' => 2, 'position' => 4]);
        $question(['type' => 'matching', 'title' => 'Q5', 'answer' => [['left' => 'a', 'right' => '1'], ['left' => 'b', 'right' => '2']], 'marks' => 2, 'position' => 5]);

        $this->student = User::factory()->create();
        $this->student->examEnrollments()->create(['exam_id' => $this->exam->id, 'price_paid' => 0]);
    }

    public function test_a_student_takes_the_exam_without_seeing_answers_and_passes()
    {
        $this->actingAs($this->student)->post(route('exams.attempts.store', $this->exam))->assertRedirect();
        $attempt = ExamAttempt::sole();

        $this->get(route('exams.attempts.show', $attempt))
            ->assertInertia(fn (Assert $page) => $page
                ->component('exams/attempt')
                ->has('questions', 5)
                ->missing('questions.0.answer')
                ->where('questions.3.items', fn ($items) => collect($items)->sort()->values()->all() === ['one', 'three', 'two']));

        $ids = $this->exam->questions()->pluck('id', 'title');
        $this->post(route('exams.attempts.submit', $attempt), ['answers' => [
            $ids['Q1'] => 1, $ids['Q2'] => [2, 0], $ids['Q3'] => ' vayu ', $ids['Q4'] => ['one', 'two', 'three'], $ids['Q5'] => ['9', '2'],
        ]])->assertRedirect(route('exams.attempts.show', $attempt));

        $attempt->refresh();
        $this->assertSame(['8.00', '10.00', true, false], [$attempt->score, $attempt->total_marks, $attempt->passed, $attempt->needs_review]);

        $this->get(route('exams.attempts.show', $attempt))->assertInertia(fn (Assert $page) => $page->component('exams/result')->where('attempt.percentage', 80));
        $this->get(route('exams.certificate', $this->exam))->assertInertia(fn (Assert $page) => $page->where('data.recipient', $this->student->name));

        // Answers can't be changed after submitting, and others can't see the attempt.
        $this->post(route('exams.attempts.submit', $attempt), ['answers' => []]);
        $this->assertSame('8.00', $attempt->fresh()->score);
        $this->actingAs(User::factory()->create())->get(route('exams.attempts.show', $attempt))->assertNotFound();
    }

    public function test_attempts_are_limited_late_answers_do_not_count_and_only_enrolled_students_start()
    {
        $this->actingAs($this->student)->post(route('exams.attempts.store', $this->exam));
        $first = ExamAttempt::sole();

        // Past the timer and the grace period, submitted answers are ignored.
        Carbon::setTestNow(now()->addMinutes(40));
        $this->post(route('exams.attempts.submit', $first), ['answers' => [$this->exam->questions()->first()->id => 1]]);
        $this->assertSame('0.00', $first->fresh()->score);

        $this->post(route('exams.attempts.store', $this->exam));
        $this->assertSame(2, ExamAttempt::count());
        ExamAttempt::query()->update(['submitted_at' => now()]);
        $this->post(route('exams.attempts.store', $this->exam))->assertSessionHas('inertia.flash_data.toast.type', 'error');
        $this->assertSame(2, ExamAttempt::count());

        $this->actingAs(User::factory()->create())->post(route('exams.attempts.store', $this->exam))->assertForbidden();
    }

    public function test_short_answers_wait_for_an_admin_to_mark_them()
    {
        $short = $this->exam->questions()->create(['type' => 'short_answer', 'title' => 'Explain', 'answer' => ['Model answer'], 'marks' => 5, 'position' => 6]);
        $this->actingAs($this->student)->post(route('exams.attempts.store', $this->exam));
        $attempt = ExamAttempt::sole();
        $this->post(route('exams.attempts.submit', $attempt), ['answers' => [$short->id => 'My explanation']]);

        $attempt->refresh();
        $this->assertTrue($attempt->needs_review);
        $this->assertNull($attempt->passed);

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->get(route('admin.exam-attempts.index', ['review' => 1]))
            ->assertInertia(fn (Assert $page) => $page->where('reviewCount', 1)->where('attempts.total', 1));
        $this->put(route('admin.exam-attempts.update', $attempt), ['marks' => [$short->id => 9]])->assertSessionHasErrors("marks.{$short->id}");
        $this->put(route('admin.exam-attempts.update', $attempt), ['marks' => [$short->id => 5]])->assertSessionHasNoErrors();

        $attempt->refresh();
        $this->assertFalse($attempt->needs_review);
        $this->assertSame('5.00', $attempt->score);
        $this->assertFalse($attempt->passed); // 5 of 15 is below 60%
    }
}
