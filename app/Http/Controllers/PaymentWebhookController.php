<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\PaymentGateway;
use App\Support\PaymentGatewayClient;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Gateways tell the site about payments here, so a customer who pays but never returns to the site
 * still gets access. A webhook only says which payment to look at: settle() asks the gateway itself
 * whether it is paid. Stripe's signature is also checked with the saved webhook signing secret.
 */
class PaymentWebhookController extends Controller
{
    public function stripe(Request $request, PaymentGatewayClient $client): Response
    {
        $gateway = PaymentGateway::where('key', 'stripe')->firstOrFail();
        $secret = $gateway->credentials[($gateway->test_mode ? 'sandbox' : 'live').'_webhook_secret'] ?? null;

        abort_unless($secret && $this->validStripeSignature($request, $secret), 400);

        $session = $request->input('data.object', []);

        if (in_array($request->input('type'), ['checkout.session.completed', 'checkout.session.async_payment_succeeded'], true)) {
            $this->settle($client, 'stripe', $session['id'] ?? null);
        }

        return response()->noContent();
    }

    public function paypal(Request $request, PaymentGatewayClient $client): Response
    {
        $orderId = match ($request->input('event_type')) {
            'CHECKOUT.ORDER.APPROVED' => $request->input('resource.id'),
            'PAYMENT.CAPTURE.COMPLETED' => $request->input('resource.supplementary_data.related_ids.order_id'),
            default => null,
        };

        $this->settle($client, 'paypal', $orderId);

        return response()->noContent();
    }

    /**
     * ToyyibPay's callback (billCallbackUrl): a form post with the bill code.
     */
    public function toyyibpay(Request $request, PaymentGatewayClient $client): Response
    {
        $this->settle($client, 'toyyibpay', $request->input('billcode'));

        return response('OK');
    }

    private function settle(PaymentGatewayClient $client, string $method, mixed $reference): void
    {
        if (! is_string($reference) || $reference === '') {
            return;
        }

        $payment = Payment::where('method', $method)->where('transaction_id', $reference)->first();

        if ($payment) {
            $client->settle($payment);
        }
    }

    /**
     * Stripe signs "timestamp.payload" with HMAC-SHA256; reject old or unsigned requests.
     */
    private function validStripeSignature(Request $request, string $secret): bool
    {
        $parts = collect(explode(',', (string) $request->header('Stripe-Signature')))
            ->map(fn (string $part) => explode('=', trim($part), 2))
            ->filter(fn (array $pair) => count($pair) === 2);
        $timestamp = (int) ($parts->firstWhere(0, 't')[1] ?? 0);

        if (abs(time() - $timestamp) > 300) {
            return false;
        }

        $expected = hash_hmac('sha256', $timestamp.'.'.$request->getContent(), $secret);

        return $parts->where(0, 'v1')->contains(fn (array $pair) => hash_equals($expected, $pair[1]));
    }
}
