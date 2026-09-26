<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\Course;
use App\Models\Exam;
use App\Models\Payment;
use App\Models\PaymentGateway;
use App\Models\Product;
use App\Support\PaymentGatewayClient;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Throwable;

/**
 * Buying a course, exam or store product: free items are granted at once; paid ones go through an
 * online gateway (Stripe, PayPal or ToyyibPay) or an offline bank transfer that an admin approves.
 */
class CheckoutController extends Controller
{
    public function show(Request $request, string $type, string $slug): Response|RedirectResponse
    {
        $item = $this->item($type, $slug);

        if ($redirect = $this->unavailable($request, $item)) {
            return $redirect;
        }

        $code = $request->string('coupon')->trim()->toString();
        $coupon = Coupon::findFor($code, $item);
        $price = $this->price($item, $coupon);

        return Inertia::render('checkout', [
            'coupon' => $coupon ? ['code' => $coupon->code, 'discount' => round((float) $item->price - $price, 2)] : null,
            'couponError' => $code !== '' && ! $coupon ? __('This coupon is not valid for this item.') : null,
            'item' => [
                'type' => $type,
                'slug' => $item->slug,
                'title' => $item->title,
                'image_url' => $item->image_url,
                'price' => (float) $item->price,
                'total' => $price,
                'url' => $this->itemUrl($item),
            ],
            'siteCurrency' => PaymentGateway::SITE_CURRENCY,
            'methods' => PaymentGateway::orderBy('id')->get()
                ->filter(fn (PaymentGateway $gateway) => $gateway->isAvailable())
                ->map(fn (PaymentGateway $gateway) => [
                    'key' => $gateway->key,
                    'currency' => $gateway->currency,
                    'amount' => $gateway->convert($price),
                    'instructions' => $gateway->key === 'offline' ? $gateway->instructions : null,
                ])
                ->values(),
        ]);
    }

    /**
     * Enrol in a free course or exam, or get a free product.
     */
    public function free(Request $request, string $type, string $slug): RedirectResponse
    {
        $item = $this->item($type, $slug);

        if ($redirect = $this->unavailable($request, $item)) {
            return $redirect;
        }

        $coupon = Coupon::findFor($request->string('coupon')->toString(), $item);
        abort_unless($this->price($item, $coupon) === 0.0, 403);

        Payment::grant($request->user(), $item, 0, (float) $item->price);

        return $this->done($item, __('You’re in. Enjoy learning!'));
    }

    /**
     * Start an online payment and send the customer to the gateway.
     */
    public function pay(Request $request, string $type, string $slug, PaymentGatewayClient $client): HttpResponse
    {
        $item = $this->item($type, $slug);

        if ($redirect = $this->unavailable($request, $item)) {
            return $redirect;
        }

        $gateway = $this->gateway($request->validate(['method' => ['required', Rule::in(['stripe', 'paypal', 'toyyibpay'])]])['method']);
        $payment = $this->newPayment($request, $item, $gateway);

        try {
            $url = $client->start(
                $gateway,
                $payment,
                route('checkout.return', $payment),
                route('checkout.cancel', $payment),
            );
        } catch (Throwable $exception) {
            Log::error('Checkout could not start a payment.', ['payment' => $payment->id, 'gateway' => $gateway->key, 'error' => $exception->getMessage()]);
            $payment->update(['status' => 'rejected', 'note' => __('Could not reach the payment provider.')]);

            return back()->withErrors(['method' => __('We could not reach the payment provider. Please try again or choose another method.')]);
        }

        return Inertia::location($url);
    }

    /**
     * Record a bank transfer with its proof; an admin approves it in Billings → Offline Payments.
     */
    public function offline(Request $request, string $type, string $slug): RedirectResponse
    {
        $item = $this->item($type, $slug);

        if ($redirect = $this->unavailable($request, $item)) {
            return $redirect;
        }

        $validated = $request->validate([
            'paid_on' => ['required', 'date', 'before_or_equal:today'],
            'transaction_id' => ['nullable', 'string', 'max:100'],
            'proof' => ['required', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png,webp'],
        ], [], ['paid_on' => __('payment date'), 'transaction_id' => __('transfer reference'), 'proof' => __('proof of payment')]);

        $payment = $this->newPayment($request, $item, $this->gateway('offline'));
        $payment->update([
            'paid_on' => $validated['paid_on'],
            'transaction_id' => $validated['transaction_id'] ?? null,
            'proof_path' => $request->file('proof')->store('payment-proofs', 'local'),
        ]);

        return $this->done($item, __('Thanks! We will give you access as soon as we have checked your payment.'));
    }

    /**
     * Back from the gateway: ask the gateway whether the payment went through before giving access.
     */
    public function return(Request $request, Payment $payment, PaymentGatewayClient $client): RedirectResponse
    {
        abort_unless($payment->user_id === $request->user()->id && $payment->method !== 'offline', 404);

        if (! $client->settle($payment)) {
            return redirect($this->checkoutUrl($payment->item()))
                ->withErrors(['method' => __('Your payment has not gone through. You have not been charged, or you can contact us if you were.')]);
        }

        return $this->done($payment->item(), __('Payment received. Thank you!'));
    }

    public function cancel(Request $request, Payment $payment): RedirectResponse
    {
        abort_unless($payment->user_id === $request->user()->id, 404);

        if ($payment->status === 'pending' && $payment->method !== 'offline') {
            $payment->update(['status' => 'rejected', 'note' => __('Cancelled by the customer.')]);
        }

        return redirect($this->checkoutUrl($payment->item()));
    }

    private function item(string $type, string $slug): Course|Exam|Product
    {
        $model = Relation::getMorphedModel($type);
        abort_unless(in_array($model, [Course::class, Exam::class, Product::class], true), 404);

        return $model::query()->where('slug', $slug)->firstOrFail();
    }

    /**
     * Send the customer back when they can't buy the item: not on sale, sold out, already theirs, or
     * waiting for an offline payment to be approved.
     */
    private function unavailable(Request $request, Course|Exam|Product $item): ?RedirectResponse
    {
        $onSale = match (true) {
            $item instanceof Course => Course::approved()->whereKey($item->id)->exists(),
            $item instanceof Exam => Exam::published()->whereKey($item->id)->exists(),
            $item instanceof Product => Product::published()->whereKey($item->id)->exists() && $item->stock !== 0,
        };

        abort_unless($onSale, 404);

        return match (Payment::ownership($request->user(), $item)) {
            'owned' => $this->done($item, __('You already have this.')),
            'pending' => $this->done($item, __('Your payment is waiting for approval.')),
            default => null,
        };
    }

    private function gateway(string $key, bool $availableOnly = true): PaymentGateway
    {
        $gateway = PaymentGateway::where('key', $key)->firstOrFail();
        abort_if($availableOnly && ! $gateway->isAvailable(), 422, __('This payment method is not available.'));

        return $gateway;
    }

    private function newPayment(Request $request, Course|Exam|Product $item, PaymentGateway $gateway): Payment
    {
        $coupon = Coupon::findFor($request->string('coupon')->toString(), $item);
        $price = $this->price($item, $coupon);

        // A coupon that makes it free goes through checkout.free instead.
        abort_if($price === 0.0, 422);

        return Payment::create([
            'user_id' => $request->user()->id,
            'payable_type' => $item->getMorphClass(),
            'payable_id' => $item->id,
            'coupon_id' => $coupon?->id,
            'discount' => round((float) $item->price - $price, 2),
            'amount' => $gateway->convert($price),
            'currency' => $gateway->currency,
            'method' => $gateway->key,
            'status' => 'pending',
        ]);
    }

    /**
     * The item's price in the site currency after an optional coupon.
     */
    private function price(Course|Exam|Product $item, ?Coupon $coupon): float
    {
        return $coupon ? $coupon->apply((float) $item->price) : round((float) $item->price, 2);
    }

    private function done(Course|Exam|Product $item, string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return redirect($this->itemUrl($item));
    }

    private function itemUrl(Course|Exam|Product $item): string
    {
        return match (true) {
            $item instanceof Course => route('courses.show', $item),
            $item instanceof Exam => route('exams.show', $item),
            $item instanceof Product => route('store.show', $item),
        };
    }

    private function checkoutUrl(Course|Exam|Product $item): string
    {
        return route('checkout.show', [$item->getMorphClass(), $item->slug]);
    }
}
