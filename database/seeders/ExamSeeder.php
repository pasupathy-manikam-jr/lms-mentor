<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Exam;
use App\Models\Instructor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ExamSeeder extends Seeder
{
    /**
     * Seed sample exams. Run after LandingSeeder, which creates the categories and instructors. Safe to run more than once.
     */
    public function run(): void
    {
        // [title, category slug, instructor, level, price, compare-at price, minutes, questions, pass %, attempts, students, rating, reviews, description]
        $exams = [
            ['Ayurveda Fundamentals Certification', 'ayurveda', 'Dr. Ananya Rao', 'beginner', 29.99, 49.99, 60, 50, 70, 3, 420, 4.8, 96, 'Test your grasp of the doshas, dhatus, malas and prakriti assessment. Passing earns a certificate you can share with employers and clients.'],
            ['Siddha Medicine Practitioner Assessment', 'siddha-medicine', 'Dr. S. Karthikeyan', 'advanced', 49.99, null, 120, 100, 75, 2, 115, 4.7, 23, 'An in-depth assessment of Siddha theory, diagnosis (envagai thervu) and materia medica for practitioners and final-year students.'],
            ['Medical Terminology Proficiency Test', 'medical-sciences', 'Dr. Marcus Bell', 'beginner', 0, null, 45, 40, 60, 5, 890, 4.6, 154, 'A free, quick check of your medical vocabulary: roots, prefixes, suffixes and common abbreviations used in clinical notes.'],
            ['Clinical Pharmacology Knowledge Exam', 'pharmacology', 'Dr. Marcus Bell', 'intermediate', 39.99, 59.99, 90, 75, 70, 3, 260, 4.7, 48, 'Covers pharmacokinetics, pharmacodynamics, drug interactions and safe prescribing through case-based questions.'],
            ['Healthcare Quality Management Exam', 'healthcare-management', 'Dr. Tom Okafor', 'advanced', 59.99, 79.99, 120, 90, 75, 2, 140, 4.8, 27, 'Assess your knowledge of accreditation standards, quality indicators, patient safety and continuous improvement in hospitals.'],
            ['Principles of Management Assessment', 'management-science', 'Prof. Meera Iyer', 'beginner', 19.99, null, 60, 50, 65, 3, 510, 4.7, 88, 'Check your understanding of planning, organising, leading and controlling, with scenario questions from healthcare settings.'],
            ['Yoga Therapy Foundations Test', 'yoga-wellness', 'Priya Nair', 'intermediate', 24.99, 34.99, 60, 45, 70, 3, 330, 4.9, 71, 'Covers asana safety, breathwork, contraindications and therapeutic sequencing for common conditions.'],
            ['Clinical Nutrition Certification Exam', 'nutrition-dietetics', 'Dr. Ananya Rao', 'intermediate', 34.99, null, 90, 70, 70, 3, 190, 4.8, 35, 'Diet planning for diabetes, hypertension and heart disease, including macronutrient calculations and counselling scenarios.'],
        ];

        // Each exam reuses the cover of the course it examines (public/images/courses/{slug}.webp).
        $courseCovers = [
            'ayurveda-fundamentals-certification' => 'foundations-of-ayurveda-doshas-dhatus-prakriti',
            'siddha-medicine-practitioner-assessment' => 'siddha-diagnosis-understanding-envagai-thervu',
            'medical-terminology-proficiency-test' => 'medical-terminology-for-health-professionals',
            'clinical-pharmacology-knowledge-exam' => 'clinical-pharmacology-basics',
            'healthcare-quality-management-exam' => 'hospital-administration-quality-management',
            'principles-of-management-assessment' => 'principles-of-management-planning-organising-leading',
            'yoga-therapy-foundations-test' => 'yoga-therapy-for-everyday-health',
            'clinical-nutrition-certification-exam' => 'clinical-nutrition-diet-planning-for-chronic-conditions',
        ];

        $categories = Category::pluck('id', 'slug');
        $instructors = Instructor::pluck('id', 'name');

        foreach ($exams as [$title, $category, $instructor, $level, $price, $compareAt, $minutes, $questions, $pass, $attempts, $students, $rating, $reviews, $description]) {
            $slug = Str::slug($title);
            // Cards show the category icon when the cover file is missing.
            $image = "images/courses/{$courseCovers[$slug]}.webp";

            Exam::updateOrCreate(['slug' => $slug], [
                'category_id' => $categories[$category],
                'instructor_id' => $instructors[$instructor],
                'title' => $title,
                'level' => $level,
                'short_description' => $description,
                'image_url' => file_exists(public_path($image)) ? "/{$image}" : null,
                'price' => $price,
                'compare_at_price' => $compareAt,
                'duration_minutes' => $minutes,
                'questions_count' => $questions,
                'pass_percentage' => $pass,
                'max_attempts' => $attempts,
                'students_count' => $students,
                'rating' => $rating,
                'reviews_count' => $reviews,
            ]);
        }
    }
}
