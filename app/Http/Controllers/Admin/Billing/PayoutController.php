<?php

namespace App\Http\Controllers\Admin\Billing;

use App\Http\Controllers\Controller;
use App\Models\PayoutRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Billings → Payout Request and Payout History, following the Mentor demo: instructors' withdrawal
 * requests, paid (with how they were paid) or rejected by an admin.
 */
class PayoutController extends Controller
{
    public function requests(Request $request): Response
    {
        return $this->list($request, 'requests');
    }

    public function history(Request $request): Response
    {
        return $this->list($request, 'history');
    }

    public function approve(Request $request, PayoutRequest $payoutRequest): RedirectResponse
    {
        abort_unless($payoutRequest->status === 'pending', 403);

        $validated = $request->validate([
            'payout_method' => ['required', 'string', 'max:100'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $payoutRequest->update([...$validated, 'status' => 'approved', 'processed_at' => now()]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payout marked as paid.')]);

        return back();
    }

    public function reject(Request $request, PayoutRequest $payoutRequest): RedirectResponse
    {
        abort_unless($payoutRequest->status === 'pending', 403);

        $payoutRequest->update([
            'status' => 'rejected',
            'note' => $request->validate(['note' => ['nullable', 'string', 'max:1000']])['note'] ?? null,
            'processed_at' => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payout request rejected.')]);

        return back();
    }

    private function list(Request $request, string $view): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'in:10,20,50'],
        ]);

        $payouts = PayoutRequest::query()
            ->with('instructor:id,name,title')
            ->when($view === 'requests', fn ($query) => $query->where('status', 'pending')->oldest(), fn ($query) => $query->where('status', '!=', 'pending')->latest('processed_at'))
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->whereRelation('instructor', 'name', 'like', "%{$search}%"))
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();

        return Inertia::render('admin/billing/payouts', ['view' => $view, 'payouts' => $payouts, 'filters' => $filters]);
    }
}
