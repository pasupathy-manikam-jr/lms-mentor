<?php

namespace App\Mail;

use App\Models\Newsletter;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;

/**
 * One newsletter to one recipient, queued, with a signed one-click unsubscribe link.
 */
class NewsletterMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Newsletter $newsletter, public string $email) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->newsletter->subject);
    }

    public function headers(): Headers
    {
        return new Headers(text: [
            'List-Unsubscribe' => '<'.$this->unsubscribeUrl().'>',
            'List-Unsubscribe-Post' => 'List-Unsubscribe=One-Click',
        ]);
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.newsletter',
            with: ['body' => $this->newsletter->body, 'unsubscribeUrl' => $this->unsubscribeUrl()],
        );
    }

    private function unsubscribeUrl(): string
    {
        return URL::signedRoute('newsletter.unsubscribe', ['email' => $this->email]);
    }
}
