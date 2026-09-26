<?php

namespace Tests\Feature\Admin;

use App\Models\CertificateTemplate;
use App\Models\Course;
use App\Models\User;
use Database\Seeders\CertificateTemplateSeeder;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CertificateTemplateTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([LandingSeeder::class, CertificateTemplateSeeder::class]);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_templates_are_listed_by_type_with_one_active_per_group()
    {
        $this->actingAs($this->admin)
            ->get(route('admin.certificates.certificate.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/certificates/index')
                ->where('kind', 'certificate')
                ->has('templates.course', 4)
                ->has('templates.exam', 2)
                ->where('templates.course.0.is_active', true));

        $this->get(route('admin.certificates.marksheet.index'))
            ->assertInertia(fn (Assert $page) => $page->where('kind', 'marksheet')->has('templates.course', 3)->missing('templates.exam'));
    }

    public function test_a_template_is_created_edited_activated_and_deleted()
    {
        $this->actingAs($this->admin)->post(route('admin.certificates.certificate.store'), $this->payload())->assertSessionHasNoErrors();
        $template = CertificateTemplate::firstWhere('name', 'Ward Gold');
        $this->assertFalse($template->is_active);
        $this->assertSame('#aa7700', $template->colors['primary']);

        $this->put(route('admin.certificates.certificate.update', $template), $this->payload(['name' => 'Ward Gold 2', 'content' => ['title' => 'Certificate of Merit', 'subtitle' => '']]))
            ->assertSessionHasNoErrors();
        $this->assertSame(['Ward Gold 2', 'Certificate of Merit', null], [$template->fresh()->name, $template->fresh()->content['title'], $template->fresh()->content['subtitle']]);

        $previous = CertificateTemplate::activeFor('certificate', 'course');
        $this->post(route('admin.certificates.certificate.activate', $template));
        $this->assertTrue($template->fresh()->is_active);
        $this->assertFalse($previous->fresh()->is_active);

        // The active template can't be deleted; another can.
        $this->delete(route('admin.certificates.certificate.destroy', $template));
        $this->assertModelExists($template);
        $this->delete(route('admin.certificates.certificate.destroy', $previous));
        $this->assertModelMissing($previous);

        // A marksheet template is not reachable from the certificate routes.
        $marksheet = CertificateTemplate::where('kind', 'marksheet')->firstOrFail();
        $this->get(route('admin.certificates.certificate.edit', $marksheet))->assertNotFound();
    }

    public function test_validation_rejects_bad_colours_and_exam_marksheets()
    {
        $this->actingAs($this->admin)
            ->post(route('admin.certificates.certificate.store'), $this->payload(['colors' => ['primary' => 'red', 'accent' => '#000000', 'background' => '#ffffff', 'text' => '#000000'], 'design' => 'baroque']))
            ->assertSessionHasErrors(['colors.primary', 'design']);
        $this->post(route('admin.certificates.marksheet.store'), $this->payload(['type' => 'exam']))->assertSessionHasErrors('type');
    }

    public function test_students_get_a_certificate_only_after_finishing_the_course()
    {
        $course = Course::approved()->firstOrFail();
        $student = User::factory()->create(['name' => 'Aisha Rahman']);
        $enrollment = $student->enrollments()->create(['course_id' => $course->id, 'price_paid' => 0]);

        $this->actingAs($student)->get(route('courses.certificate', $course))->assertNotFound();

        $enrollment->update(['completed_at' => '2026-09-20 10:00:00']);
        $this->get(route('courses.certificate', $course))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('courses/certificate')
                ->where('data.recipient', 'Aisha Rahman')
                ->where('data.course', $course->title)
                ->where('template.design', 'classic'));

        $this->actingAs(User::factory()->create())->get(route('admin.certificates.certificate.index'))->assertForbidden();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'name' => 'Ward Gold', 'type' => 'course', 'design' => 'classic',
            'colors' => ['primary' => '#AA7700', 'accent' => '#ddbb66', 'background' => '#fffaf0', 'text' => '#333333'],
            'content' => ['title' => 'Certificate of Completion', 'subtitle' => 'has completed', 'organization' => 'Saṅgaṇakīya Śikṣā'],
            ...$overrides,
        ];
    }
}
