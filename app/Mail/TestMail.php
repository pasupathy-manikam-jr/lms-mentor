<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

/**
 * Sent from Settings → SMTP to check the mail server works. Sent at once, not queued.
 */
class TestMail extends Mailable
{
    public function envelope(): Envelope
    {
        return new Envelope(subject: __('Test email from :name', ['name' => config('app.name')]));
    }

    public function content(): Content
    {
        return new Content(htmlString: '<p>'.e(__('Your mail settings work. This message was sent from Settings → SMTP.')).'</p>');
    }
}
