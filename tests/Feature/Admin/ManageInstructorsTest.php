<?php

namespace Tests\Feature\Admin;

use App\Models\Course;
use App\Models\Instructor;
use App\Models\User;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ManageInstructorsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(LandingSeeder::class);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_the_list_shows_approved_instructors_with_course_counts()
    {
        $count = Instructor::count();
        Instructor::create(['name' => 'Applicant', 'title' => 'Nurse', 'status' => 'pending']);

        $this->actingAs($this->admin)
            ->get(route('admin.instructors.index', ['search' => 'Ananya']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/instructors/index')
                ->where('view', 'instructors')
                ->where('instructors.total', 1)
                ->where('instructors.data.0.courses_count', Course::whereRelation('instructor', 'name', 'Dr. Ananya Rao')->count()));

        $this->get(route('admin.instructors.index'))->assertInertia(fn (Assert $page) => $page->where('instructors.total', $count));
        $this->get(route('admin.instructors.applications'))->assertInertia(fn (Assert $page) => $page
            ->where('view', 'applications')
            ->where('instructors.total', 1));
    }

    public function test_an_admin_makes_a_user_an_instructor()
    {
        Storage::fake('local');
        $user = User::factory()->create(['name' => 'Aisha Rahman']);

        $this->actingAs($this->admin)->post(route('admin.instructors.store'), [
            'user_id' => $user->id, 'title' => 'Clinical Nutritionist', 'skills' => ['Diet planning', ' Diabetes '],
            'biography' => 'Ten years in hospital nutrition.', 'resume' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
        ])->assertRedirect(route('admin.instructors.index'));

        $instructor = $user->instructor;
        $this->assertSame(['Aisha Rahman', 'approved', ['Diet planning', 'Diabetes']], [$instructor->name, $instructor->status, $instructor->skills]);
        $this->assertTrue($user->fresh()->hasRole('instructor'));
        Storage::disk('local')->assertExists($instructor->resume_path);
        $this->get(route('admin.instructors.resume', $instructor))->assertDownload('cv.pdf');

        // A user can only be one instructor.
        $this->post(route('admin.instructors.store'), ['user_id' => $user->id, 'title' => 'Again'])->assertSessionHasErrors('user_id');

        $this->get(route('team.show', $instructor))->assertInertia(fn (Assert $page) => $page->where('instructor.biography', 'Ten years in hospital nutrition.'));
    }

    public function test_a_user_applies_and_an_admin_approves_or_rejects()
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('instructor-application.show'))->assertInertia(fn (Assert $page) => $page
            ->component('instructor-application')
            ->where('application', null));
        $this->post(route('instructor-application.store'), ['title' => 'Yoga Therapist'])->assertSessionHasErrors('resume');
        $this->post(route('instructor-application.store'), [
            'title' => 'Yoga Therapist', 'resume' => UploadedFile::fake()->create('cv.pdf', 50, 'application/pdf'),
        ])->assertSessionHasNoErrors();

        $instructor = $user->fresh()->instructor;
        $this->assertSame('pending', $instructor->status);
        $this->post(route('instructor-application.store'), ['title' => 'Again', 'resume' => UploadedFile::fake()->create('b.pdf', 10, 'application/pdf')])
            ->assertForbidden();
        $this->get(route('team.show', $instructor))->assertNotFound();

        $this->actingAs($this->admin)->patch(route('admin.instructors.status', $instructor), ['status' => 'approved']);
        $this->assertTrue($user->fresh()->hasRole('instructor'));
        $this->patch(route('admin.instructors.status', $instructor), ['status' => 'rejected']);
        $this->assertFalse($user->fresh()->hasRole('instructor'));

        // Rejected users can apply again; the old resume is replaced.
        $oldResume = $instructor->fresh()->resume_path;
        $this->actingAs($user)->post(route('instructor-application.store'), [
            'title' => 'Senior Yoga Therapist', 'resume' => UploadedFile::fake()->create('new.pdf', 50, 'application/pdf'),
        ])->assertSessionHasNoErrors();
        $this->assertSame(['pending', 'Senior Yoga Therapist'], [$instructor->fresh()->status, $instructor->fresh()->title]);
        Storage::disk('local')->assertMissing($oldResume);
    }

    public function test_instructors_who_teach_are_kept_and_others_can_be_deleted()
    {
        $teacher = Course::whereNotNull('instructor_id')->firstOrFail()->instructor;
        $this->actingAs($this->admin)->delete(route('admin.instructors.destroy', $teacher));
        $this->assertModelExists($teacher);

        $idle = Instructor::create(['name' => 'Idle', 'title' => 'Tutor']);
        $this->delete(route('admin.instructors.destroy', $idle));
        $this->assertModelMissing($idle);
    }

    public function test_students_cannot_manage_instructors()
    {
        $this->actingAs(User::factory()->create())->get(route('admin.instructors.index'))->assertForbidden();
    }
}
