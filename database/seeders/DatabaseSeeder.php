<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * The demo accounts (admin from AdminSeeder, student from EnrollmentSeeder; the instructor is created
     * through Admin > Instructors on staging, not seeded). With DEMO_LOGINS=true the login page offers them as
     * one-click logins, so never enable that flag on a live server.
     */
    public const LOGINS = [
        ['name' => 'Admin', 'email' => 'admin@example.com', 'password' => 'Zx123456'],
        ['name' => 'Instructor', 'email' => 'ananya.rao@example.com', 'password' => 'Zx123456'],
        ['name' => 'Student', 'email' => 'anand.raj@example.com', 'password' => 'Zx123456'],
    ];

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $this->call([AdminSeeder::class, LandingSeeder::class, CurriculumSeeder::class, CourseInfoSeeder::class, ExamSeeder::class, ExamQuestionSeeder::class, EnrollmentSeeder::class, ProductSeeder::class, ProductOrderSeeder::class, JobOpeningSeeder::class, CertificateTemplateSeeder::class, MediaSeeder::class]);
    }
}
