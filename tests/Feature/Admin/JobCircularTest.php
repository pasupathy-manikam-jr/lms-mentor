<?php

namespace Tests\Feature\Admin;

use App\Models\JobOpening;
use App\Models\User;
use Database\Seeders\JobOpeningSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class JobCircularTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(JobOpeningSeeder::class);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_the_list_shows_every_circular_and_searches_by_title()
    {
        JobOpening::orderBy('id')->first()->update(['status' => 'draft']);

        $this->actingAs($this->admin)
            ->get(route('admin.job-circulars.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/job-circulars/index')->where('jobs.total', 6));

        $this->get(route('admin.job-circulars.index', ['search' => 'intern']))
            ->assertInertia(fn (Assert $page) => $page->where('jobs.total', 1));
    }

    public function test_a_circular_is_created_as_a_draft_then_activated_and_listed_on_careers()
    {
        $this->actingAs($this->admin)
            ->post(route('admin.job-circulars.store'), $this->payload())
            ->assertRedirect(route('admin.job-circulars.index'));

        $job = JobOpening::where('slug', 'ward-nurse-educator')->firstOrFail();
        $this->assertSame(['draft', ['Teaching', 'Nursing'], 3000, 4500, '<p>Teach nurses.</p>'], [$job->status, $job->skills, $job->salary_min, $job->salary_max, $job->description]);
        $this->get(route('careers.show', $job->slug))->assertNotFound();

        $this->put(route('admin.job-circulars.update', $job), $this->payload(['status' => 'active', 'negotiable' => true, 'slug' => 'nurse-educator']))
            ->assertSessionHasNoErrors();
        $job->refresh();
        $this->assertSame(['active', null, null, 'nurse-educator'], [$job->status, $job->salary_min, $job->salary_max, $job->slug]);

        $this->get(route('careers.show', 'nurse-educator'))
            ->assertInertia(fn (Assert $page) => $page->where('summary', 'Teach nurses.'));

        $this->patch(route('admin.job-circulars.update', $job), [])->assertStatus(405);
        $job->update(['status' => 'closed']);
        $this->get(route('careers.show', 'nurse-educator'))->assertNotFound();
    }

    public function test_validation_needs_a_salary_range_unless_negotiable_and_known_types()
    {
        $this->actingAs($this->admin)
            ->post(route('admin.job-circulars.store'), $this->payload(['salary_min' => null, 'salary_max' => 100, 'job_type' => 'gig', 'apply_email' => 'nope']))
            ->assertSessionHasErrors(['salary_min', 'job_type', 'apply_email']);

        $this->post(route('admin.job-circulars.store'), $this->payload(['salary_min' => 5000, 'salary_max' => 4000]))
            ->assertSessionHasErrors('salary_max');
    }

    public function test_circulars_can_be_deleted_and_students_cannot_manage_them()
    {
        $job = JobOpening::orderBy('id')->firstOrFail();
        $this->actingAs($this->admin)->delete(route('admin.job-circulars.destroy', $job));
        $this->assertModelMissing($job);

        $this->actingAs(User::factory()->create())->get(route('admin.job-circulars.index'))->assertForbidden();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'title' => 'Ward Nurse Educator', 'description' => '<p>Teach nurses.</p><script>x</script>', 'status' => 'draft',
            'apply_email' => 'careers@example.com', 'job_type' => 'full-time', 'work_type' => 'hybrid', 'experience_level' => 'mid',
            'positions' => 2, 'location' => 'Kuala Lumpur, Malaysia', 'deadline' => today()->addMonth()->toDateString(),
            'skills' => ['Teaching', ' Nursing '], 'negotiable' => false, 'currency' => 'MYR', 'salary_min' => 3000, 'salary_max' => 4500,
            ...$overrides,
        ];
    }
}
