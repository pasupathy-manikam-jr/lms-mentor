<?php

namespace App\Http\Controllers\Admin\Billing;

use App\Http\Controllers\Controller;
use App\Models\PaymentGateway;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Billings → Configuration (the demo's Payment Gateways): turn each payment method on or off, pick test
 * or live mode and the currency, and store its keys. Saved keys are never sent back to the browser;
 * a blank field keeps the saved value.
 */
class PaymentGatewayController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/billing/gateways', [
            'gateways' => PaymentGateway::orderBy('id')->get()->map(fn (PaymentGateway $gateway) => [
                ...$gateway->only(['id', 'key', 'enabled', 'test_mode', 'currency', 'exchange_rate', 'instructions']),
                'fields' => $gateway->credentialFields(),
                // Paste into the gateway's dashboard; ToyyibPay is given it with each bill.
                'webhook_url' => in_array($gateway->key, ['stripe', 'paypal'], true) ? route("webhooks.{$gateway->key}") : null,
                // Which keys are saved, without their values.
                'saved' => collect($gateway->credentialFields())
                    ->mapWithKeys(fn (string $field) => [$field => filled($gateway->credentials[$field] ?? null)]),
            ]),
            'currencies' => PaymentGateway::CURRENCIES,
            'siteCurrency' => PaymentGateway::SITE_CURRENCY,
        ]);
    }

    public function update(Request $request, PaymentGateway $gateway): RedirectResponse
    {
        $fields = $gateway->credentialFields();
        $validated = $request->validate([
            'enabled' => ['boolean'],
            'test_mode' => ['boolean'],
            'currency' => ['required', $gateway->key === 'toyyibpay' ? Rule::in(['MYR']) : Rule::in(PaymentGateway::CURRENCIES)],
            'exchange_rate' => [Rule::requiredIf($request->input('currency') !== PaymentGateway::SITE_CURRENCY), 'nullable', 'numeric', 'gt:0', 'max:1000000'],
            'credentials' => ['array:'.implode(',', $fields)],
            'credentials.*' => ['nullable', 'string', 'max:500'],
            'instructions' => [Rule::requiredIf($gateway->key === 'offline' && $request->boolean('enabled')), 'nullable', 'string', 'max:5000'],
        ], [], ['instructions' => __('payment instructions'), 'exchange_rate' => __('exchange rate')]);

        $credentials = [...($gateway->credentials ?? []), ...array_filter($validated['credentials'] ?? [], 'filled')];
        $mode = $request->boolean('test_mode') ? 'sandbox' : 'live';
        $missing = collect(PaymentGateway::CREDENTIALS[$gateway->key])
            ->reject(fn (string $name) => filled($credentials["{$mode}_{$name}"] ?? null));

        // An online gateway can only be switched on once the keys for its current mode are saved.
        if ($request->boolean('enabled') && $missing->isNotEmpty()) {
            return back()->withErrors(['enabled' => __('Add the :mode keys before enabling this gateway.', ['mode' => __($mode === 'sandbox' ? 'sandbox' : 'live')])]);
        }

        $gateway->update([
            'enabled' => $request->boolean('enabled'),
            'test_mode' => $request->boolean('test_mode'),
            'currency' => $validated['currency'],
            'exchange_rate' => $validated['currency'] === PaymentGateway::SITE_CURRENCY ? null : $validated['exchange_rate'],
            'credentials' => $credentials,
            'instructions' => $validated['instructions'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment settings saved.')]);

        return back();
    }
}
