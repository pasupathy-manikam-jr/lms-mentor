<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminSectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admins_see_the_placeholder_for_a_listed_section()
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get(route('admin.section', 'ai-assistant'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/section')
                ->where('section', 'ai-assistant'));
    }

    public function test_unknown_sections_return_not_found()
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->get('/dashboard/no-such-section')->assertNotFound();
    }

    public function test_non_admins_are_forbidden()
    {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.section', 'courses'))
            ->assertForbidden();
    }
}
