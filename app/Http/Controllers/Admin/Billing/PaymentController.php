<?php

namespace App\Http\Controllers\Admin\Billing;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Billings → Online Payments and Offline Payments, following the Mentor demo. Approving an offline
 * payment gives the customer the course, exam or product.
 */
class PaymentController extends Controller
{
    public function online(Request $request): Response
    {
        return $this->report($request, 'online', Payment::where('method', '!=', 'offline')->where('status', 'paid'));
    }

    public function offline(Request $request): Response
    {
        $status = $request->validate(['status' => ['nullable', Rule::in(['pending', 'paid', 'rejected'])]])['status'] ?? null;

        return $this->report(
            $request,
            'offline',
            Payment::where('method', 'offline')->when($status, fn ($query) => $query->where('status', $status)),
            ['status' => $status],
        );
    }

    public function approve(Payment $payment): RedirectResponse
    {
        abort_unless($payment->method === 'offline' && $payment->status === 'pending', 403);

        $payment->fulfil();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment approved. The customer now has access.')]);

        return back();
    }

    public function reject(Request $request, Payment $payment): RedirectResponse
    {
        abort_unless($payment->method === 'offline' && $payment->status === 'pending', 403);

        $payment->update([
            'status' => 'rejected',
            'note' => $request->validate(['note' => ['nullable', 'string', 'max:1000']])['note'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment rejected.')]);

        return back();
    }

    public function proof(Payment $payment): StreamedResponse
    {
        abort_unless($payment->proof_path !== null, 404);

        return Storage::disk('local')->response($payment->proof_path);
    }

    /**
     * @param  Builder<Payment>  $query
     * @param  array<string, mixed>  $extra
     */
    private function report(Request $request, string $type, Builder $query, array $extra = []): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'in:10,20,50'],
        ]);

        $payments = $query
            ->with(['user:id,name,email', 'payable:id,title'])
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query
                ->whereLike('transaction_id', "%{$search}%")
                ->orWhereHas('user', fn ($query) => $query->whereLike('name', "%{$search}%")->orWhereLike('email', "%{$search}%"))))
            ->latest('id')
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString()
            ->through(fn (Payment $payment) => [
                ...$payment->only(['id', 'amount', 'currency', 'method', 'transaction_id', 'status', 'paid_on', 'note']),
                'has_proof' => $payment->proof_path !== null,
                'user' => $payment->user->only(['name', 'email']),
                'item' => ['type' => $payment->payable_type, 'title' => $payment->payable?->getAttribute('title')],
                'created_at' => $payment->created_at->toIso8601String(),
            ]);

        return Inertia::render('admin/billing/payments', ['type' => $type, 'payments' => $payments, 'filters' => $filters, ...$extra]);
    }
}
