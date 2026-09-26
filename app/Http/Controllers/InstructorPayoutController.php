<?php

namespace App\Http\Controllers;

use App\Models\Enrollment;
use App\Models\ExamEnrollment;
use App\Models\Instructor;
use App\Models\PayoutRequest;
use App\Models\ProductOrder;
use App\Support\ContentOwner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Billings for instructors (the demo's Withdraw and Settings): their earnings, withdrawal requests and
 * payout details. Admins pay the requests in Billings → Payout request.
 */
class InstructorPayoutController extends Controller
{
    public function index(Request $request): Response
    {
        $instructor = $this->instructor();

        return Inertia::render('instructor/payouts', [
            'balance' => $this->balance($instructor),
            'payouts' => PayoutRequest::whereBelongsTo($instructor)->latest()->paginate(10),
            'payoutDetails' => $instructor->payout_details,
        ]);
    }

    /**
     * Ask for a withdrawal, up to the available balance; one pending request at a time.
     */
    public function store(Request $request): RedirectResponse
    {
        $instructor = $this->instructor();
        $balance = $this->balance($instructor);

        if (blank($instructor->payout_details)) {
            return back()->withErrors(['amount' => __('Add your payout details in Settings first.')]);
        }

        if (PayoutRequest::whereBelongsTo($instructor)->where('status', 'pending')->exists()) {
            return back()->withErrors(['amount' => __('You already have a pending request.')]);
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:'.$balance['available']],
        ], ['amount.max' => __('You can withdraw up to :amount.', ['amount' => number_format($balance['available'], 2)])]);

        PayoutRequest::create(['instructor_id' => $instructor->id, 'amount' => $validated['amount'], 'status' => 'pending']);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Withdrawal requested.')]);

        return back();
    }

    public function settings(): Response
    {
        return Inertia::render('instructor/payout-settings', ['payoutDetails' => $this->instructor()->payout_details]);
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        $this->instructor()->update($request->validate(['payout_details' => ['required', 'string', 'max:2000']]));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payout details saved.')]);

        return back();
    }

    private function instructor(): Instructor
    {
        return Instructor::findOrFail(ContentOwner::instructorId() ?? abort(403));
    }

    /**
     * Earnings are the instructor's share of what students paid for their courses, exams and products;
     * pending and paid withdrawals come off the available balance.
     *
     * @return array{earned: float, withdrawn: float, pending: float, available: float}
     */
    private function balance(Instructor $instructor): array
    {
        $share = config('lms.instructor_revenue_share') / 100;
        $sales = (float) Enrollment::whereRelation('course', 'instructor_id', $instructor->id)->sum('price_paid')
            + (float) ExamEnrollment::whereRelation('exam', 'instructor_id', $instructor->id)->sum('price_paid')
            + (float) ProductOrder::whereRelation('product', 'instructor_id', $instructor->id)->sum('total');
        $earned = round($sales * $share, 2);
        $withdrawn = (float) PayoutRequest::whereBelongsTo($instructor)->where('status', 'approved')->sum('amount');
        $pending = (float) PayoutRequest::whereBelongsTo($instructor)->where('status', 'pending')->sum('amount');

        return [
            'earned' => $earned,
            'withdrawn' => $withdrawn,
            'pending' => $pending,
            'available' => max(0, round($earned - $withdrawn - $pending, 2)),
        ];
    }
}
