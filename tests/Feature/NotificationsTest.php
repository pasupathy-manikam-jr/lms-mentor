<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NotificationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_unread_notifications_are_shared_and_can_be_marked_read()
    {
        $admin = User::factory()->admin()->create();
        $admin->notifications()->create([
            'id' => Str::uuid()->toString(),
            'type' => 'test',
            'data' => ['title' => 'New enrolment', 'message' => 'Someone joined a course.'],
        ]);

        $this->actingAs($admin)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('notifications', 1)
                ->where('notifications.0.data.title', 'New enrolment'));

        $this->actingAs($admin)
            ->post(route('notifications.read-all'))
            ->assertRedirect();

        $this->assertSame(0, $admin->unreadNotifications()->count());
    }

    public function test_guests_cannot_mark_notifications_read()
    {
        $this->post(route('notifications.read-all'))->assertRedirect(route('login'));
    }
}
