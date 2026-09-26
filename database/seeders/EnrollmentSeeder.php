<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Exam;
use App\Models\ExamEnrollment;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Sample students with course enrolments (and some exam enrolments) spread over the current year, so the Enrollments list and the dashboard
 * (enrolments, students, admin revenue) have data. The same input always gives the same result, and
 * students that already exist are skipped, so it is safe to run again. Every sample account uses the
 * password "password".
 */
class EnrollmentSeeder extends Seeder
{
    /**
     * @var list<string>
     */
    private const STUDENTS = [
        'Nur Aisyah Binti Rahman', 'Muhammad Hafiz Bin Ismail', 'Tan Wei Ling', 'Lim Jun Hao', 'Priya Nair',
        'Arjun Menon', 'Siti Nurhaliza Binti Omar', 'Chong Mei Yee', 'Kavitha Subramaniam', 'Ahmad Faiz Bin Yusof',
        'Wong Kar Wai', 'Deepa Krishnan', 'Nurul Izzah Binti Hassan', 'Lee Chee Keong', 'Rajesh Kumar',
        'Farah Nadia Binti Aziz', 'Goh Siew Ling', 'Anand Raj', 'Aina Sofea Binti Kamal', 'Ng Boon Hock',
        'Lakshmi Iyer', 'Hakim Bin Abdullah', 'Chan Li Ting', 'Vikram Sharma',
    ];

    public function run(): void
    {
        $courses = Course::approved()->orderBy('id')->get();
        $exams = Exam::published()->orderBy('id')->get();

        if ($courses->isEmpty()) {
            return;
        }

        $year = now()->year;

        foreach (self::STUDENTS as $i => $name) {
            $email = Str::slug(Str::before($name, ' Bin'), '.').'@example.com';

            $student = User::firstWhere('email', $email);

            if ($student) {
                $this->enrolInExam($student, $exams, $i, $year);

                continue;
            }

            $student = User::forceCreate([
                'name' => $name,
                'email' => $email,
                'password' => 'password',
                'email_verified_at' => now(),
            ]);
            $student->assignRole(UserRole::Student);

            // One to three courses each, spread across the catalog and the months so far this year.
            foreach (range(0, $i % 3) as $n) {
                $course = $courses[($i * 5 + $n * 7) % $courses->count()];
                $enrolledAt = now()->setDate($year, 1 + ($i + $n * 4) % now()->month, 1 + ($i * 3 + $n) % 28)->setTime(9 + $n, 15);
                // Never in the future (days late in the current month).
                $enrolledAt = $enrolledAt->isFuture() ? now()->subDays(1 + $i % 7) : $enrolledAt;
                $isFree = ($i + $n) % 5 === 0 || (float) $course->price === 0.0;

                Enrollment::forceCreate([
                    'user_id' => $student->id,
                    'course_id' => $course->id,
                    'price_paid' => $isFree ? 0 : $course->price,
                    'expires_at' => $course->expiry_type === 'limited_time' && $course->expiry_months
                        ? $enrolledAt->addMonths($course->expiry_months)
                        : null,
                    'created_at' => $enrolledAt,
                    'updated_at' => $enrolledAt,
                ]);

                // Some progress through the course, so the player shows partly completed learners.
                $lessons = $course->lessons()->lessonsOnly()->pluck('id');
                $student->completedLessons()->syncWithoutDetaching($lessons->take(($i + $n) % ($lessons->count() + 1)));
            }

            $this->enrolInExam($student, $exams, $i, $year);
        }
    }

    /**
     * Every third student also takes an exam; added once, even for students seeded earlier.
     *
     * @param  Collection<int, Exam>  $exams
     */
    private function enrolInExam(User $student, Collection $exams, int $i, int $year): void
    {
        if ($exams->isEmpty() || $i % 3 !== 0 || $student->examEnrollments()->exists()) {
            return;
        }

        $exam = $exams[$i % $exams->count()];
        $enrolledAt = now()->setDate($year, 1 + $i % now()->month, 1 + $i % 28)->setTime(14, 0);
        $enrolledAt = $enrolledAt->isFuture() ? now()->subDays(2) : $enrolledAt;

        ExamEnrollment::forceCreate([
            'user_id' => $student->id,
            'exam_id' => $exam->id,
            'price_paid' => $i % 2 === 0 ? 0 : $exam->price,
            'expires_at' => $exam->accessEndsAt(),
            'created_at' => $enrolledAt,
            'updated_at' => $enrolledAt,
        ]);

    }
}
