<?php

namespace App\Http\Controllers;

use App\Models\NewsletterSubscriber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use Inertia\Inertia;

class NewsletterSubscriptionController extends Controller
{
    /**
     * Add an email address to the newsletter list.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        // Same response whether or not the address was already subscribed, so the form can't be used to check emails.
        // Subscribing again after unsubscribing turns newsletters back on.
        NewsletterSubscriber::updateOrCreate(['email' => Str::lower($validated['email'])], ['unsubscribed_at' => null]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __("Thanks! You're on the list.")]);

        return back();
    }

    /**
     * One-click unsubscribe from the signed link in every newsletter. Works for users too, who are
     * recorded here so newsletters to students and all users skip them.
     */
    public function unsubscribe(string $email): Response
    {
        NewsletterSubscriber::updateOrCreate(['email' => Str::lower($email)], ['unsubscribed_at' => now()]);

        return response(__('You have been unsubscribed and will not receive our newsletter any more.'));
    }
}
