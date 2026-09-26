<?php

namespace Database\Seeders;

use App\Enums\CourseInfoType;
use App\Models\Course;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

/**
 * Fills each catalog course's Info tab (FAQs, requirements and outcomes) from data/course-info.json.
 * Courses that already have info items are left alone, so it is safe to run again.
 */
class CourseInfoSeeder extends Seeder
{
    public function run(): void
    {
        /** @var array<string, array{faqs: list<array{question: string, answer: string}>, requirements: list<string>, outcomes: list<string>}> $info */
        $info = File::json(__DIR__.'/data/course-info.json', JSON_THROW_ON_ERROR);

        Course::whereIn('title', array_keys($info))->whereDoesntHave('infoItems')->get()
            ->each(function (Course $course) use ($info) {
                $data = $info[$course->title];

                foreach ($data['faqs'] as $position => $faq) {
                    $course->infoItems()->create(['type' => CourseInfoType::Faq, 'title' => $faq['question'], 'body' => $faq['answer'], 'position' => $position + 1]);
                }

                foreach (['requirements' => CourseInfoType::Requirement, 'outcomes' => CourseInfoType::Outcome] as $key => $type) {
                    foreach ($data[$key] as $position => $text) {
                        $course->infoItems()->create(['type' => $type, 'title' => $text, 'position' => $position + 1]);
                    }
                }
            });
    }
}
