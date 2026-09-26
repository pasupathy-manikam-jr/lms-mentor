<?php

namespace Database\Seeders;

use App\Enums\LessonContentType;
use App\Enums\LessonType;
use App\Models\Course;
use App\Support\HtmlSanitizer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

/**
 * Gives each catalog course its curriculum from data/curriculum.json: sections of text lessons, each
 * ending in a quiz. Courses that already have sections are left alone, so it is safe to run again.
 */
class CurriculumSeeder extends Seeder
{
    public function run(HtmlSanitizer $sanitizer): void
    {
        /** @var array<string, list<array{section: string, lessons: list<array{title: string, minutes: int, body: string, description: string}>, quiz: array{title: string, minutes: int, total_mark: int, pass_mark: int, retake_attempts: int, summary: string}}>> $curriculum */
        $curriculum = File::json(__DIR__.'/data/curriculum.json', JSON_THROW_ON_ERROR);

        Course::whereIn('title', array_keys($curriculum))->whereDoesntHave('sections')->get()
            ->each(function (Course $course) use ($curriculum, $sanitizer) {
                foreach ($curriculum[$course->title] as $sectionIndex => $sectionData) {
                    $section = $course->sections()->create(['title' => $sectionData['section'], 'position' => $sectionIndex + 1]);
                    $position = 0;

                    foreach ($sectionData['lessons'] as $lesson) {
                        $section->lessons()->create([
                            'course_id' => $course->id,
                            'type' => LessonType::Lesson,
                            'content_type' => LessonContentType::Text,
                            'title' => $lesson['title'],
                            'body' => $sanitizer->clean($lesson['body']),
                            'description' => $lesson['description'],
                            'duration_minutes' => $lesson['minutes'],
                            'position' => ++$position,
                        ]);
                    }

                    $quiz = $sectionData['quiz'];
                    $section->lessons()->create([
                        'course_id' => $course->id,
                        'type' => LessonType::Quiz,
                        'title' => $quiz['title'],
                        'body' => $sanitizer->clean($quiz['summary']),
                        'time_limit_seconds' => $quiz['minutes'] * 60,
                        'duration_minutes' => $quiz['minutes'],
                        'total_mark' => $quiz['total_mark'],
                        'pass_mark' => $quiz['pass_mark'],
                        'retake_attempts' => $quiz['retake_attempts'],
                        'position' => ++$position,
                    ]);
                }

                // Catalog duration follows the lessons, as it does when editing the curriculum.
                $course->update(['duration_minutes' => (int) $course->lessons()->lessonsOnly()->sum('duration_minutes')]);
            });
    }
}
