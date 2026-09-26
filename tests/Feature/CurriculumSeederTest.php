<?php

namespace Tests\Feature;

use App\Enums\LessonType;
use App\Models\Course;
use App\Models\CourseSection;
use Database\Seeders\CurriculumSeeder;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CurriculumSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_every_course_gets_sections_ending_in_a_quiz_and_reseeding_adds_nothing()
    {
        $this->seed([LandingSeeder::class, CurriculumSeeder::class]);
        $sectionCount = CourseSection::count();
        $this->seed(CurriculumSeeder::class);

        $this->assertSame($sectionCount, CourseSection::count());

        Course::with('sections.lessons')->get()->each(function (Course $course) {
            $this->assertCount(2, $course->sections, $course->title);

            foreach ($course->sections as $section) {
                $this->assertSame(LessonType::Quiz, $section->lessons->last()->type);
                $this->assertTrue($section->lessons->where('type', LessonType::Lesson)->every(fn ($lesson) => filled($lesson->body)));
            }

            $this->assertSame((int) $course->lessons()->lessonsOnly()->sum('duration_minutes'), $course->duration_minutes);
        });
    }
}
