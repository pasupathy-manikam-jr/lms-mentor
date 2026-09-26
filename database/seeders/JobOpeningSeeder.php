<?php

namespace Database\Seeders;

use App\Models\JobOpening;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class JobOpeningSeeder extends Seeder
{
    /**
     * Seed sample vacancies. Deadlines are relative to today so they stay open. Safe to run more than once.
     */
    public function run(): void
    {
        // [title, location, job type, work type, level, positions, days until deadline, salary min, salary max (null = negotiable), skills, description]
        $jobs = [
            ['Ayurveda Course Instructor', 'Bengaluru, India', 'part-time', 'remote', 'senior', 2, 23, 60000, 90000, ['BAMS or MD (Ayurveda)', '5+ years clinical practice', 'Video lessons', 'Curriculum design'], 'Teach our Ayurveda foundations and diet courses through recorded lessons and monthly live sessions. You will plan lesson outlines, answer learner questions and help write exam questions.'],
            ['Siddha Medicine Content Specialist', 'Chennai, India', 'contract', 'hybrid', 'mid', 1, 18, 45000, 65000, ['BSMS', 'Tamil and English writing', 'Siddha pharmacology', 'Research reading'], 'Turn classical Siddha texts and clinical notes into clear lessons, study guides and store resources, working with our Siddha instructor.'],
            ['Medical Content Reviewer', 'Anywhere in India', 'part-time', 'remote', 'senior', 3, 30, null, null, ['MBBS or MD', 'Evidence-based medicine', 'Attention to detail', 'Plain-language writing'], 'Review every medical and pharmacology lesson for accuracy and safety before it is published, and flag claims that need references.'],
            ['Learning Experience Designer', 'Pune, India', 'full-time', 'hybrid', 'mid', 1, 14, 55000, 80000, ['Instructional design', 'Assessment writing', 'Figma or similar', 'LMS authoring'], 'Shape how learners move through our courses: structure modules, design quizzes and exams, and improve completion rates using learner feedback.'],
            ['Learner Support Associate', 'Kochi, India', 'full-time', 'on-site', 'entry', 2, 21, 25000, 32000, ['Clear written English', 'Malayalam or Tamil', 'Patience', 'Help-desk tools'], 'Help learners with enrolment, payments, certificates and technical questions by email and chat, and pass course feedback to instructors.'],
            ['Healthcare Management Intern', 'Mumbai, India', 'internship', 'hybrid', 'entry', 3, 28, 15000, 15000, ['MBA or MHA student', 'Spreadsheets', 'Research', 'Report writing'], 'Support our hospital administration and quality management courses by researching case studies, building templates and drafting practice questions.'],
        ];

        foreach ($jobs as [$title, $location, $jobType, $workType, $level, $positions, $days, $min, $max, $skills, $description]) {
            JobOpening::updateOrCreate(['slug' => Str::slug($title)], [
                'title' => $title,
                'location' => $location,
                'job_type' => $jobType,
                'work_type' => $workType,
                'experience_level' => $level,
                'positions' => $positions,
                'deadline' => today()->addDays($days),
                'description' => '<p>'.e($description).'</p>',
                'skills' => $skills,
                'salary_min' => $min,
                'salary_max' => $max,
                'currency' => 'INR',
                // Placeholder address: replace with your own careers inbox.
                'apply_email' => 'careers@example.com',
            ]);
        }
    }
}
