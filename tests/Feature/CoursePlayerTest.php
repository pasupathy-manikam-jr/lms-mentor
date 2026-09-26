<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\ExamAttempt;
use App\Models\Lesson;
use App\Models\User;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CoursePlayerTest extends TestCase
{
    use RefreshDatabase;

    private Course $course;

    private Lesson $first;

    private Lesson $second;

    private Lesson $quiz;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(LandingSeeder::class);
        $this->course = Course::orderBy('id')->firstOrFail();
        $section = $this->course->sections()->create(['title' => 'Basics', 'position' => 1]);
        $this->first = $section->lessons()->create(['course_id' => $this->course->id, 'title' => 'Welcome', 'position' => 1, 'duration_minutes' => 10]);
        $this->second = $section->lessons()->create(['course_id' => $this->course->id, 'title' => 'Vital signs', 'position' => 2, 'duration_minutes' => 20]);
        $this->quiz = $section->lessons()->create(['course_id' => $this->course->id, 'type' => 'quiz', 'title' => 'Basics quiz', 'position' => 3, 'duration_minutes' => 15]);
    }

    public function test_only_admins_and_enrolled_students_can_open_the_player()
    {
        $this->get(route('courses.learn', ['course' => $this->course]))->assertRedirect(route('login'));

        $stranger = User::factory()->create();
        $this->actingAs($stranger)->get(route('courses.learn', [$this->course, $this->first]))->assertForbidden();

        $student = $this->enrolledStudent();
        $this->actingAs($student)->get(route('courses.learn', [$this->course, $this->first]))->assertOk();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->get(route('courses.learn', [$this->course, $this->first]))->assertOk();
    }

    public function test_the_player_continues_at_the_first_unfinished_item_and_links_its_neighbours()
    {
        $student = $this->enrolledStudent();
        $student->completedLessons()->attach($this->first);

        $this->actingAs($student)
            ->get(route('courses.learn', ['course' => $this->course]))
            ->assertRedirect(route('courses.learn', [$this->course, $this->second]));

        $this->actingAs($student)
            ->get(route('courses.learn', [$this->course, $this->second]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('courses/player')
                ->where('current.title', 'Vital signs')
                ->where('previousId', $this->first->id)
                ->where('nextId', $this->quiz->id)
                ->where('completedIds', [$this->first->id])
                ->has('sections.0.lessons', 3));
    }

    public function test_a_lesson_of_another_course_is_not_found()
    {
        $other = Course::whereKeyNot($this->course->id)->firstOrFail();
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get(route('courses.learn', [$other, $this->first]))->assertNotFound();
    }

    public function test_lessons_can_be_marked_complete_and_undone_but_quizzes_cannot()
    {
        $student = $this->enrolledStudent();

        $this->actingAs($student)->post(route('courses.learn.complete', [$this->course, $this->first]));
        $this->assertTrue($student->completedLessons()->whereKey($this->first->id)->exists());

        $this->actingAs($student)->post(route('courses.learn.complete', [$this->course, $this->first]));
        $this->assertFalse($student->completedLessons()->whereKey($this->first->id)->exists());

        $this->actingAs($student)->post(route('courses.learn.complete', [$this->course, $this->quiz]))->assertStatus(422);
    }

    public function test_a_course_can_only_be_finished_once_everything_is_complete()
    {
        $student = $this->enrolledStudent();
        $student->completedLessons()->attach([$this->first->id, $this->second->id]);

        $this->actingAs($student)->post(route('courses.finish', $this->course));
        $this->assertNull($student->enrollments()->first()->completed_at);

        $student->completedLessons()->attach($this->quiz);
        $this->actingAs($student)->post(route('courses.finish', $this->course));
        $this->assertNotNull($student->enrollments()->first()->completed_at);
    }

    public function test_an_enrolled_student_starts_a_quiz_but_not_a_lesson()
    {
        $this->quiz->questions()->create(['type' => 'multiple_choice', 'title' => 'Q', 'options' => ['A', 'B'], 'answer' => [0], 'marks' => 1, 'position' => 1]);
        $this->actingAs($this->enrolledStudent());

        $this->post(route('courses.learn.quiz', [$this->course, $this->quiz]))
            ->assertRedirect(route('exams.attempts.show', ExamAttempt::sole()));
        $this->post(route('courses.learn.quiz', [$this->course, $this->first]))->assertNotFound();
    }

    private function enrolledStudent(): User
    {
        $student = User::factory()->create();
        Enrollment::create(['user_id' => $student->id, 'course_id' => $this->course->id, 'price_paid' => 0]);

        return $student;
    }
}
