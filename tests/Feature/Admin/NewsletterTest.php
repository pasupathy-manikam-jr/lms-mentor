<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Mail\NewsletterMail;
use App\Models\Newsletter;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use Database\Seeders\AdminSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NewsletterTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(AdminSeeder::class);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_a_newsletter_is_written_sanitized_and_sent_once_to_subscribers_who_have_not_left()
    {
        Mail::fake();
        NewsletterSubscriber::create(['email' => 'reader@example.com']);
        NewsletterSubscriber::create(['email' => 'gone@example.com', 'unsubscribed_at' => now()]);

        $this->actingAs($this->admin)
            ->post(route('admin.newsletters.store'), ['subject' => 'October tips', 'body' => '<p>Hello</p><script>x</script>'])
            ->assertSessionHasNoErrors();
        $newsletter = Newsletter::sole();
        $this->assertSame('<p>Hello</p>', $newsletter->body);

        $this->get(route('admin.newsletters.index'))->assertInertia(fn (Assert $page) => $page
            ->component('admin/newsletters/index')
            ->where('audiences.subscribers', 1)
            ->where('unsubscribedCount', 1));

        $this->post(route('admin.newsletters.send', $newsletter), ['audience' => 'subscribers'])->assertSessionHasNoErrors();

        Mail::assertQueued(NewsletterMail::class, 1);
        Mail::assertQueued(NewsletterMail::class, fn (NewsletterMail $mail) => $mail->hasTo('reader@example.com'));
        $this->assertSame(['subscribers', 1], [$newsletter->fresh()->audience, $newsletter->fresh()->recipients_count]);

        // Sent newsletters can't be sent again or edited.
        $this->post(route('admin.newsletters.send', $newsletter), ['audience' => 'users'])->assertForbidden();
        $this->put(route('admin.newsletters.update', $newsletter), ['subject' => 'x', 'body' => '<p>x</p>'])->assertForbidden();
    }

    public function test_students_audience_skips_people_who_unsubscribed_through_the_signed_link()
    {
        Mail::fake();
        $stays = User::factory()->create(['email' => 'stays@example.com']);
        $leaves = User::factory()->create(['email' => 'leaves@example.com']);
        $stays->assignRole(UserRole::Student->value);
        $leaves->assignRole(UserRole::Student->value);

        $this->get(URL::signedRoute('newsletter.unsubscribe', ['email' => 'Leaves@example.com']))->assertOk();
        $this->get(route('newsletter.unsubscribe', ['email' => 'stays@example.com']))->assertForbidden(); // unsigned

        $newsletter = Newsletter::create(['subject' => 'Hi', 'body' => '<p>Hi</p>']);
        $this->actingAs($this->admin)->post(route('admin.newsletters.send', $newsletter), ['audience' => 'students']);

        Mail::assertQueued(NewsletterMail::class, 1);
        Mail::assertQueued(NewsletterMail::class, fn (NewsletterMail $mail) => $mail->hasTo('stays@example.com'));

        // Subscribing again turns it back on.
        $this->post(route('newsletter.subscribe'), ['email' => 'leaves@example.com']);
        $this->assertNull(NewsletterSubscriber::firstWhere('email', 'leaves@example.com')->unsubscribed_at);
    }

    public function test_the_email_has_an_unsubscribe_link_and_empty_audiences_are_refused()
    {
        $newsletter = Newsletter::create(['subject' => 'Hi', 'body' => '<p>Body text</p>']);
        $mail = new NewsletterMail($newsletter, 'reader@example.com');
        $mail->assertSeeInHtml('Body text', false);
        $mail->assertSeeInHtml('newsletter/unsubscribe/reader@example.com', false);

        $this->actingAs($this->admin)->post(route('admin.newsletters.send', $newsletter), ['audience' => 'subscribers'])
            ->assertSessionHasErrors('audience');

        $this->actingAs(User::factory()->create())->get(route('admin.newsletters.index'))->assertForbidden();
    }
}
