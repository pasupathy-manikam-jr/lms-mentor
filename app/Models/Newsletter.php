<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * A newsletter email written in the admin and sent to one audience.
 *
 * @property int $id
 * @property string $subject
 * @property string $body Sanitized rich-text HTML.
 * @property string|null $audience subscribers|students|users
 * @property int $recipients_count
 * @property Carbon|null $sent_at
 */
#[Fillable(['subject', 'body', 'audience', 'recipients_count', 'sent_at'])]
class Newsletter extends Model
{
    public const AUDIENCES = ['subscribers', 'students', 'users'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    /**
     * The email addresses in an audience, without anyone who unsubscribed.
     *
     * @return Collection<int, string>
     */
    public static function recipients(string $audience): Collection
    {
        $optedOut = NewsletterSubscriber::whereNotNull('unsubscribed_at')->select('email');

        $emails = match ($audience) {
            'subscribers' => NewsletterSubscriber::whereNull('unsubscribed_at')->pluck('email'),
            'students' => User::role('student')->whereNotIn('email', $optedOut)->pluck('email'),
            'users' => User::whereNotIn('email', $optedOut)->pluck('email'),
        };

        return $emails->map(fn (string $email) => strtolower($email))->unique()->values();
    }
}
