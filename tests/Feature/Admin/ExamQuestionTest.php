<?php

namespace Tests\Feature\Admin;

use App\Enums\QuestionType;
use App\Models\Exam;
use App\Models\ExamQuestion;
use App\Models\User;
use Database\Seeders\ExamSeeder;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExamQuestionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Exam $exam;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([LandingSeeder::class, ExamSeeder::class]);
        $this->admin = User::factory()->admin()->create();
        $this->exam = Exam::orderBy('id')->firstOrFail();
    }

    public function test_each_question_type_is_saved_with_its_answer_key_and_counted()
    {
        $this->actingAs($this->admin);
        $store = route('admin.exams.questions.store', $this->exam);

        foreach ([
            ['type' => 'multiple_choice', 'options' => ['Vata', 'Pitta', 'Kapha'], 'answer' => [1]],
            ['type' => 'multiple_select', 'options' => ['Rasa', 'Rakta', 'Agni'], 'answer' => [0, 1]],
            ['type' => 'fill_blank', 'answer' => ['seven', '7']],
            ['type' => 'ordering', 'answer' => ['Plan', 'Do', 'Check', 'Act']],
            ['type' => 'matching', 'answer' => [['left' => 'Vata', 'right' => 'Air'], ['left' => 'Pitta', 'right' => 'Fire']]],
            ['type' => 'short_answer', 'answer' => ['Model answer.']],
        ] as $question) {
            $this->post($store, ['title' => 'Q', 'marks' => 2, 'description' => '<p>Hi<script>x()</script></p>', ...$question])->assertSessionHasNoErrors();
        }

        $this->assertSame(6, $this->exam->refresh()->questions_count);
        $this->assertSame(QuestionType::Matching, $this->exam->questions()->where('type', 'matching')->first()->type);
        $this->assertSame('<p>Hi</p>', $this->exam->questions()->first()->description);
        $this->assertNull($this->exam->questions()->where('type', 'ordering')->first()->options);
    }

    public function test_answer_keys_must_fit_the_type()
    {
        $this->actingAs($this->admin);
        $store = route('admin.exams.questions.store', $this->exam);

        $this->post($store, ['type' => 'multiple_choice', 'title' => 'Q', 'marks' => 1, 'options' => ['a', 'b'], 'answer' => []])->assertSessionHasErrors('answer');
        $this->post($store, ['type' => 'multiple_choice', 'title' => 'Q', 'marks' => 1, 'options' => ['a', 'b'], 'answer' => [0, 1]])->assertSessionHasErrors('answer');
        $this->post($store, ['type' => 'multiple_select', 'title' => 'Q', 'marks' => 1, 'options' => ['a', 'b'], 'answer' => [5]])->assertSessionHasErrors('answer');
        $this->post($store, ['type' => 'ordering', 'title' => 'Q', 'marks' => 1, 'answer' => ['only one']])->assertSessionHasErrors('answer');
        $this->post($store, ['type' => 'matching', 'title' => 'Q', 'marks' => 1, 'answer' => [['left' => 'a'], ['left' => 'b', 'right' => 'c']]])->assertSessionHasErrors('answer.0.right');
        $this->post($store, ['type' => 'listening', 'title' => 'Q', 'marks' => 1, 'answer' => ['x']])->assertSessionHasErrors('type');

        $this->assertSame(0, $this->exam->questions()->count());
    }

    public function test_questions_are_updated_reordered_deleted_and_scoped_to_their_exam()
    {
        $this->actingAs($this->admin);
        [$first, $second] = collect([1, 2])->map(fn ($n) => $this->exam->questions()->create(['type' => 'fill_blank', 'title' => "Q{$n}", 'answer' => ['x'], 'marks' => 1, 'position' => $n]));

        $this->put(route('admin.exams.questions.update', [$this->exam, $first]), ['type' => 'fill_blank', 'title' => 'Renamed', 'marks' => 3, 'answer' => ['y']])->assertSessionHasNoErrors();
        $this->assertSame('Renamed', $first->refresh()->title);

        $this->put(route('admin.exams.questions.sort', $this->exam), ['ids' => [$second->id, $first->id]])->assertSessionHasNoErrors();
        $this->assertSame(['Q2', 'Renamed'], $this->exam->questions()->pluck('title')->all());

        $other = Exam::whereKeyNot($this->exam->id)->firstOrFail();
        $this->delete(route('admin.exams.questions.destroy', [$other, $first]))->assertNotFound();

        $this->delete(route('admin.exams.questions.destroy', [$this->exam, $first]));
        $this->assertModelMissing($first);
        $this->assertSame(1, $this->exam->refresh()->questions_count);
        $this->assertInstanceOf(ExamQuestion::class, $second->fresh());
    }
}
