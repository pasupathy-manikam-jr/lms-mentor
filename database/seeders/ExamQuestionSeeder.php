<?php

namespace Database\Seeders;

use App\Models\Exam;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

/**
 * Loads each catalog exam's questions from data/exam-questions.json and sets its question count and
 * total marks from them. Exams that already have questions are left alone, so it is safe to run again.
 */
class ExamQuestionSeeder extends Seeder
{
    public function run(): void
    {
        /** @var array<string, list<array{type: string, title: string, description: ?string, marks: int|float, options: ?list<string>, answer: list<mixed>}>> $bank */
        $bank = File::json(__DIR__.'/data/exam-questions.json', JSON_THROW_ON_ERROR);

        Exam::whereIn('title', array_keys($bank))->whereDoesntHave('questions')->get()
            ->each(function (Exam $exam) use ($bank) {
                foreach ($bank[$exam->title] as $position => $question) {
                    $exam->questions()->create([...$question, 'position' => $position + 1]);
                }

                $exam->update([
                    'questions_count' => $exam->questions()->count(),
                    'total_marks' => (int) ceil((float) $exam->questions()->sum('marks')),
                ]);
            });
    }
}
