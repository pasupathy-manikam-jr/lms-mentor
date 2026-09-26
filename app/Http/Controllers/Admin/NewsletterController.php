<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\NewsletterMail;
use App\Models\Newsletter;
use App\Models\NewsletterSubscriber;
use App\Support\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Newsletters, following the Mentor demo: write a newsletter, then send it to subscribers, students or
 * all users. Each email is queued separately and carries an unsubscribe link.
 */
class NewsletterController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'in:10,20,50'],
        ]);

        return Inertia::render('admin/newsletters/index', [
            'newsletters' => Newsletter::query()
                ->when($filters['search'] ?? null, fn ($query, $search) => $query->whereLike('subject', "%{$search}%"))
                ->latest('id')
                ->paginate($filters['per_page'] ?? 10)
                ->withQueryString(),
            'filters' => $filters,
            'audiences' => collect(Newsletter::AUDIENCES)->mapWithKeys(fn (string $audience) => [$audience => Newsletter::recipients($audience)->count()]),
            'unsubscribedCount' => NewsletterSubscriber::whereNotNull('unsubscribed_at')->count(),
        ]);
    }

    public function store(Request $request, HtmlSanitizer $sanitizer): RedirectResponse
    {
        Newsletter::create($this->validated($request, $sanitizer));

        return $this->done(__('Newsletter saved.'));
    }

    public function update(Request $request, Newsletter $newsletter, HtmlSanitizer $sanitizer): RedirectResponse
    {
        abort_if($newsletter->sent_at !== null, 403);

        $newsletter->update($this->validated($request, $sanitizer));

        return $this->done(__('Newsletter saved.'));
    }

    /**
     * Queue one email per recipient. A newsletter is sent once; duplicate it to send again.
     */
    public function send(Request $request, Newsletter $newsletter): RedirectResponse
    {
        abort_if($newsletter->sent_at !== null, 403);

        $audience = $request->validate(['audience' => ['required', Rule::in(Newsletter::AUDIENCES)]])['audience'];
        $recipients = Newsletter::recipients($audience);

        if ($recipients->isEmpty()) {
            return back()->withErrors(['audience' => __('There is no one to send to in this audience.')]);
        }

        $newsletter->update(['audience' => $audience, 'recipients_count' => $recipients->count(), 'sent_at' => now()]);

        foreach ($recipients as $email) {
            Mail::to($email)->queue(new NewsletterMail($newsletter, $email));
        }

        return $this->done(__('Newsletter queued for :count recipients.', ['count' => $recipients->count()]));
    }

    public function destroy(Newsletter $newsletter): RedirectResponse
    {
        $newsletter->delete();

        return $this->done(__('Newsletter deleted.'));
    }

    /**
     * @return array{subject: string, body: string}
     */
    private function validated(Request $request, HtmlSanitizer $sanitizer): array
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:200'],
            'body' => ['required', 'string', 'max:200000'],
        ], [], ['body' => __('description')]);

        return ['subject' => $validated['subject'], 'body' => (string) $sanitizer->clean($validated['body'])];
    }

    private function done(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
