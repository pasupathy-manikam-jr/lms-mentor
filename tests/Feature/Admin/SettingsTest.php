<?php

namespace Tests\Feature\Admin;

use App\Mail\TestMail;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\AdminSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(AdminSeeder::class);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_system_details_are_saved_and_shown_in_the_footer()
    {
        $this->actingAs($this->admin)->put(route('admin.settings.update', 'system'), [
            'site_name' => 'Saṅgaṇakīya Śikṣā', 'contact_email' => 'hello@sikshya.test', 'contact_phone' => '+60 3 1234 5678', 'address' => 'Kuala Lumpur',
        ])->assertSessionHasNoErrors();

        $this->get(route('home'))->assertInertia(fn (Assert $page) => $page
            ->where('site.contact_email', 'hello@sikshya.test')
            ->where('site.address', 'Kuala Lumpur'));
    }

    public function test_the_mail_password_is_encrypted_never_sent_back_and_kept_when_blank()
    {
        $smtp = ['host' => 'smtp.example.com', 'port' => 587, 'encryption' => 'tls', 'username' => 'u', 'password' => 'secret-pass', 'from_address' => 'noreply@example.com', 'from_name' => 'Site'];
        $this->actingAs($this->admin)->put(route('admin.settings.update', 'smtp'), $smtp)->assertSessionHasNoErrors();
        $this->put(route('admin.settings.update', 'smtp'), [...$smtp, 'password' => '']);

        $this->assertSame('secret-pass', Setting::section('smtp')['password']);
        $this->assertStringNotContainsString('secret-pass', DB::table('settings')->value('values'));
        $this->get(route('admin.settings.show', 'smtp'))
            ->assertDontSee('secret-pass')
            ->assertInertia(fn (Assert $page) => $page->where('values.has_password', true)->missing('values.password'));

        Mail::fake();
        $this->post(route('admin.settings.test-mail'))->assertSessionHasNoErrors();
        Mail::assertSent(TestMail::class, fn (TestMail $mail) => $mail->hasTo($this->admin->email));
    }

    public function test_sign_ups_can_be_closed_and_analytics_ids_must_be_safe()
    {
        $this->actingAs($this->admin)->put(route('admin.settings.update', 'auth'), ['registration_open' => false]);
        $this->put(route('admin.settings.update', 'analytics'), ['google_analytics_id' => "G-1');alert(1)//", 'meta_pixel_id' => 'abc'])
            ->assertSessionHasErrors(['google_analytics_id', 'meta_pixel_id']);
        $this->put(route('admin.settings.update', 'analytics'), ['google_analytics_id' => 'G-ABC123XYZ', 'meta_pixel_id' => '123456789012'])
            ->assertSessionHasNoErrors();

        auth()->logout();
        $this->get(route('home'))->assertSee('googletagmanager.com/gtag/js?id=G-ABC123XYZ', false)->assertSee("fbq('init', \"123456789012\")", false);
        $this->post(route('register.store'), ['name' => 'New', 'email' => 'new@example.com', 'password' => 'Password-123!', 'password_confirmation' => 'Password-123!'])
            ->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_maintenance_mode_and_cache_clearing_run_the_artisan_commands()
    {
        Artisan::shouldReceive('call')->once()->withArgs(fn ($command, $options) => $command === 'down' && strlen($options['--secret']) === 32);
        $this->actingAs($this->admin)->put(route('admin.maintenance.update'), ['down' => true])->assertRedirectContains('/');

        Artisan::shouldReceive('call')->once()->with('up');
        $this->put(route('admin.maintenance.update'), ['down' => false])->assertRedirect(route('admin.maintenance'));

        Artisan::shouldReceive('call')->once()->with('optimize:clear');
        $this->post(route('admin.maintenance.clear-cache'));

        $this->get(route('admin.maintenance'))->assertInertia(fn (Assert $page) => $page->component('admin/maintenance')->where('isDown', false));
        $this->actingAs(User::factory()->create())->get(route('admin.settings.show', 'system'))->assertForbidden();
    }
}
