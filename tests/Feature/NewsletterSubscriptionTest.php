<?php

namespace Tests\Feature;

use App\Models\NewsletterSubscriber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NewsletterSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_visitors_can_subscribe()
    {
        $this->from(route('home'))
            ->post(route('newsletter.subscribe'), ['email' => 'Learner@Example.com'])
            ->assertRedirect(route('home'))
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('newsletter_subscribers', ['email' => 'learner@example.com']);
    }

    public function test_subscribing_twice_does_not_duplicate_or_reveal_the_address()
    {
        NewsletterSubscriber::create(['email' => 'learner@example.com']);

        $this->from(route('home'))
            ->post(route('newsletter.subscribe'), ['email' => 'learner@example.com'])
            ->assertRedirect(route('home'))
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('newsletter_subscribers', 1);
    }

    public function test_email_must_be_valid()
    {
        $this->from(route('home'))
            ->post(route('newsletter.subscribe'), ['email' => 'not-an-email'])
            ->assertSessionHasErrors('email');

        $this->assertDatabaseCount('newsletter_subscribers', 0);
    }
}
