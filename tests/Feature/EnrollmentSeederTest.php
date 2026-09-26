<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Enrollment;
use App\Models\ExamEnrollment;
use App\Models\User;
use Database\Seeders\CurriculumSeeder;
use Database\Seeders\EnrollmentSeeder;
use Database\Seeders\ExamSeeder;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnrollmentSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_sample_students_are_enrolled_this_year_without_duplicates_or_future_dates()
    {
        $this->seed([LandingSeeder::class, CurriculumSeeder::class, ExamSeeder::class, EnrollmentSeeder::class]);
        $examCount = ExamEnrollment::count();
        $count = Enrollment::count();
        $this->seed(EnrollmentSeeder::class);

        $this->assertSame($count, Enrollment::count(), 'reseeding adds nothing');
        $this->assertSame($examCount, ExamEnrollment::count());
        $this->assertSame(8, $examCount, 'every third student takes an exam');
        $this->assertSame(24, User::role(UserRole::Student)->count());
        $this->assertGreaterThan(24, $count);
        $this->assertTrue(Enrollment::where('created_at', '>', now())->doesntExist());
        $this->assertTrue(Enrollment::whereYear('created_at', '!=', now()->year)->doesntExist());
        $this->assertTrue(Enrollment::where('price_paid', '>', 0)->exists());
        $this->assertTrue(Enrollment::where('price_paid', 0)->exists());
    }
}
