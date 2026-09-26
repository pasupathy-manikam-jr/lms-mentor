<?php

namespace App\Support;

use App\Models\Payment;
use App\Models\PaymentGateway;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/**
 * Talks to Stripe Checkout, PayPal Orders and ToyyibPay over their HTTPS APIs (no SDKs). start()
 * returns the gateway page to send the customer to; confirm() asks the gateway itself whether the
 * payment went through, so nothing in the return URL is trusted.
 */
class PaymentGatewayClient
{
    /**
     * Create the payment at the gateway and return where to send the customer. The gateway's own
     * reference is saved on the payment so confirm() can check it.
     */
    public function start(PaymentGateway $gateway, Payment $payment, string $returnUrl, string $cancelUrl): string
    {
        $title = Str::limit((string) $payment->item()->title, 100, '');

        return match ($gateway->key) {
            'stripe' => $this->startStripe($gateway, $payment, $title, $returnUrl, $cancelUrl),
            'paypal' => $this->startPaypal($gateway, $payment, $title, $returnUrl, $cancelUrl),
            'toyyibpay' => $this->startToyyibpay($gateway, $payment, $title, $returnUrl),
            default => throw new RuntimeException("{$gateway->key} is not an online gateway."),
        };
    }

    /**
     * Check an online payment with its gateway and, when it is paid, give the customer the item. Used
     * by the return page and by webhooks, which can arrive at the same time, so the payment row is
     * locked while it is settled. Returns whether the payment is paid.
     */
    public function settle(Payment $payment): bool
    {
        return DB::transaction(function () use ($payment) {
            $payment = Payment::whereKey($payment->id)->lockForUpdate()->firstOrFail();

            if ($payment->status === 'paid') {
                return true;
            }

            // A payment the customer abandoned (rejected) can still be paid later, e.g. a slow bank.
            if ($payment->method === 'offline' || $payment->transaction_id === null) {
                return false;
            }

            try {
                $transactionId = $this->confirm(PaymentGateway::where('key', $payment->method)->firstOrFail(), $payment);
            } catch (Throwable $exception) {
                Log::error('Could not confirm a payment with its gateway.', ['payment' => $payment->id, 'error' => $exception->getMessage()]);

                return false;
            }

            if ($transactionId === null) {
                return false;
            }

            $payment->update(['transaction_id' => $transactionId]);
            $payment->fulfil();

            return true;
        });
    }

    /**
     * Whether the gateway reports the payment as paid in full. Returns the gateway's transaction ID
     * when it is, or null.
     */
    public function confirm(PaymentGateway $gateway, Payment $payment): ?string
    {
        return match ($gateway->key) {
            'stripe' => $this->confirmStripe($gateway, $payment),
            'paypal' => $this->confirmPaypal($gateway, $payment),
            'toyyibpay' => $this->confirmToyyibpay($gateway, $payment),
            default => null,
        };
    }

    private function startStripe(PaymentGateway $gateway, Payment $payment, string $title, string $returnUrl, string $cancelUrl): string
    {
        $session = $this->stripe($gateway)->asForm()->post('checkout/sessions', [
            'mode' => 'payment',
            'client_reference_id' => $payment->id,
            'customer_email' => $payment->user->email,
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => strtolower($payment->currency),
                    'unit_amount' => $this->minorUnits($payment),
                    'product_data' => ['name' => $title],
                ],
            ]],
            'success_url' => $returnUrl,
            'cancel_url' => $cancelUrl,
        ])->throw()->json();

        $payment->update(['transaction_id' => $session['id']]);

        return $session['url'];
    }

    private function confirmStripe(PaymentGateway $gateway, Payment $payment): ?string
    {
        $session = $this->stripe($gateway)->get("checkout/sessions/{$payment->transaction_id}")->throw()->json();

        $isPaid = ($session['payment_status'] ?? null) === 'paid'
            && (string) ($session['client_reference_id'] ?? '') === (string) $payment->id
            && (int) ($session['amount_total'] ?? 0) === $this->minorUnits($payment)
            && strtoupper($session['currency'] ?? '') === $payment->currency;

        return $isPaid ? ($session['payment_intent'] ?? $session['id']) : null;
    }

    private function startPaypal(PaymentGateway $gateway, Payment $payment, string $title, string $returnUrl, string $cancelUrl): string
    {
        $order = $this->paypal($gateway)->post('v2/checkout/orders', [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'custom_id' => (string) $payment->id,
                'description' => $title,
                'amount' => ['currency_code' => $payment->currency, 'value' => number_format((float) $payment->amount, 2, '.', '')],
            ]],
            'application_context' => [
                'brand_name' => Str::limit((string) config('app.name'), 127, ''),
                'user_action' => 'PAY_NOW',
                'shipping_preference' => 'NO_SHIPPING',
                'return_url' => $returnUrl,
                'cancel_url' => $cancelUrl,
            ],
        ])->throw()->json();

        $payment->update(['transaction_id' => $order['id']]);

        return collect((array) ($order['links'] ?? []))->firstWhere('rel', 'approve')['href']
            ?? throw new RuntimeException('PayPal did not return an approval link.');
    }

    private function confirmPaypal(PaymentGateway $gateway, Payment $payment): ?string
    {
        $response = $this->paypal($gateway)->post("v2/checkout/orders/{$payment->transaction_id}/capture", (object) []);
        $order = $response->json();

        // A second capture of the same order is refused; read the order instead.
        if ($response->failed()) {
            $order = $this->paypal($gateway)->get("v2/checkout/orders/{$payment->transaction_id}")->throw()->json();
        }

        $unit = $order['purchase_units'][0] ?? [];
        $capture = $unit['payments']['captures'][0] ?? [];

        $isPaid = ($order['status'] ?? null) === 'COMPLETED'
            && ($capture['status'] ?? null) === 'COMPLETED'
            && (string) ($capture['custom_id'] ?? $unit['custom_id'] ?? '') === (string) $payment->id
            && ($capture['amount']['currency_code'] ?? null) === $payment->currency
            && (float) ($capture['amount']['value'] ?? 0) === (float) $payment->amount;

        return $isPaid ? ($capture['id'] ?? $order['id']) : null;
    }

    private function startToyyibpay(PaymentGateway $gateway, Payment $payment, string $title, string $returnUrl): string
    {
        $bills = Http::baseUrl($this->toyyibpayBase($gateway))->asForm()->post('index.php/api/createBill', [
            'userSecretKey' => $this->credential($gateway, 'secret_key'),
            'categoryCode' => $this->credential($gateway, 'category_code'),
            'billName' => Str::limit($title, 30, ''),
            'billDescription' => Str::limit($title, 100, ''),
            'billPriceSetting' => 1,
            'billPayorInfo' => 0,
            'billAmount' => $this->minorUnits($payment),
            'billReturnUrl' => $returnUrl,
            'billCallbackUrl' => route('webhooks.toyyibpay'),
            'billExternalReferenceNo' => $payment->id,
            'billEmail' => $payment->user->email,
        ])->throw()->json();

        $billCode = $bills[0]['BillCode'] ?? throw new RuntimeException('ToyyibPay did not create a bill.');
        $payment->update(['transaction_id' => $billCode]);

        return $this->toyyibpayBase($gateway).'/'.$billCode;
    }

    private function confirmToyyibpay(PaymentGateway $gateway, Payment $payment): ?string
    {
        $transactions = Http::baseUrl($this->toyyibpayBase($gateway))->asForm()->post('index.php/api/getBillTransactions', [
            'billCode' => $payment->transaction_id,
            'billpaymentStatus' => 1,
        ])->throw()->json();

        $paid = collect(is_array($transactions) ? $transactions : [])->first(fn ($transaction) => is_array($transaction)
            && (string) ($transaction['billpaymentStatus'] ?? '') === '1'
            && (float) ($transaction['billpaymentAmount'] ?? 0) === (float) $payment->amount);

        return $paid ? ($paid['billpaymentInvoiceNo'] ?? $payment->transaction_id) : null;
    }

    private function stripe(PaymentGateway $gateway): PendingRequest
    {
        return Http::baseUrl('https://api.stripe.com/v1')->withToken($this->credential($gateway, 'secret_key'))->acceptJson();
    }

    private function paypal(PaymentGateway $gateway): PendingRequest
    {
        $base = $gateway->test_mode ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
        $token = Http::baseUrl($base)
            ->withBasicAuth($this->credential($gateway, 'client_id'), $this->credential($gateway, 'client_secret'))
            ->asForm()
            ->post('v1/oauth2/token', ['grant_type' => 'client_credentials'])
            ->throw()
            ->json('access_token');

        return Http::baseUrl($base)->withToken($token)->acceptJson();
    }

    private function toyyibpayBase(PaymentGateway $gateway): string
    {
        return $gateway->test_mode ? 'https://dev.toyyibpay.com' : 'https://toyyibpay.com';
    }

    /**
     * A saved key for the gateway's current mode, e.g. sandbox_secret_key.
     */
    private function credential(PaymentGateway $gateway, string $name): string
    {
        $mode = $gateway->test_mode ? 'sandbox' : 'live';

        return (string) ($gateway->credentials["{$mode}_{$name}"] ?? throw new RuntimeException("Missing {$mode} {$name} for {$gateway->key}."));
    }

    /**
     * The amount in the currency's smallest unit (cents, sen), as Stripe and ToyyibPay expect.
     */
    private function minorUnits(Payment $payment): int
    {
        return (int) round((float) $payment->amount * 100);
    }
}
