<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\AdminSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ManageUsersTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(AdminSeeder::class);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_users_are_listed_searched_and_filtered_by_role()
    {
        $student = User::factory()->create(['name' => 'Tan Wei Ling']);
        $student->assignRole(UserRole::Student->value);

        $this->actingAs($this->admin)
            ->get(route('admin.users.index', ['search' => 'wei ling']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/users/index')
                ->where('users.total', 1)
                ->where('users.data.0.role', 'student')
                ->where('users.data.0.is_active', true));

        $this->get(route('admin.users.index', ['role' => 'admin']))
            ->assertInertia(fn (Assert $page) => $page->where('users.data.0.role', 'admin'));
    }

    public function test_an_admin_edits_a_user_and_a_deactivated_user_is_signed_out()
    {
        $user = User::factory()->create();
        $user->assignRole(UserRole::Student->value);

        $this->actingAs($this->admin)->put(route('admin.users.update', $user), [
            'name' => 'Renamed', 'email' => 'renamed@example.com', 'role' => 'instructor', 'is_active' => false,
        ])->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertSame(['Renamed', 'renamed@example.com', false], [$user->name, $user->email, $user->is_active]);
        $this->assertSame(['instructor'], $user->getRoleNames()->all());

        $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('login'));
        $this->assertGuest();
    }

    public function test_admins_cannot_lock_themselves_out_or_delete_themselves()
    {
        $this->actingAs($this->admin)->put(route('admin.users.update', $this->admin), [
            'name' => $this->admin->name, 'email' => $this->admin->email, 'role' => 'student', 'is_active' => true,
        ])->assertSessionHasErrors('role');
        $this->put(route('admin.users.update', $this->admin), [
            'name' => $this->admin->name, 'email' => $this->admin->email, 'role' => 'admin', 'is_active' => false,
        ])->assertSessionHasErrors('role');
        $this->delete(route('admin.users.destroy', $this->admin))->assertForbidden();

        $other = User::factory()->create();
        $this->put(route('admin.users.update', $other), ['name' => 'x', 'email' => $this->admin->email, 'role' => 'student'])
            ->assertSessionHasErrors('email');
        $this->delete(route('admin.users.destroy', $other));
        $this->assertModelMissing($other);

        $this->actingAs(User::factory()->create())->get(route('admin.users.index'))->assertForbidden();
    }
}
