<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;

/**
 * A payment method's settings, edited in Billings → Configuration. Credentials are stored encrypted
 * and never sent to the browser.
 *
 * @property int $id
 * @property string $key
 * @property bool $enabled
 * @property bool $test_mode
 * @property string $currency
 * @property string|null $exchange_rate 1 site-currency unit in this gateway's currency; needed when they differ.
 * @property array<string, string>|null $credentials
 * @property string|null $instructions
 */
#[Fillable(['enabled', 'test_mode', 'currency', 'exchange_rate', 'credentials', 'instructions'])]
#[Hidden(['credentials'])]
class PaymentGateway extends Model
{
    /**
     * The currency prices are set and shown in.
     *
     * ponytail: fixed to USD to match the "$" shown on every price; move to Settings → System when that page is built.
     */
    public const SITE_CURRENCY = 'USD';

    /**
     * Currencies the site can charge in. ToyyibPay only takes Malaysian ringgit.
     *
     * @var list<string>
     */
    public const CURRENCIES = ['INR', 'MYR', 'CNY', 'SGD', 'USD', 'EUR', 'GBP', 'AED'];

    /**
     * The credentials each gateway needs, for its sandbox and its live account. Offline has none.
     *
     * @var array<string, list<string>>
     */
    public const CREDENTIALS = [
        'stripe' => ['publishable_key', 'secret_key', 'webhook_secret'],
        'paypal' => ['client_id', 'client_secret'],
        'toyyibpay' => ['secret_key', 'category_code'],
        'offline' => [],
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'test_mode' => 'boolean',
            'credentials' => 'encrypted:array',
            'exchange_rate' => 'decimal:6',
        ];
    }

    /**
     * An item's site-currency price in this gateway's currency, or null when no rate is set.
     */
    public function convert(float $price): ?float
    {
        if ($this->currency === self::SITE_CURRENCY) {
            return round($price, 2);
        }

        return $this->exchange_rate ? round($price * (float) $this->exchange_rate, 2) : null;
    }

    /**
     * Whether customers can pick this method at checkout: switched on, and able to price in its currency.
     */
    public function isAvailable(): bool
    {
        return $this->enabled && $this->convert(1) !== null;
    }

    /**
     * Credential field names for this gateway, prefixed by environment, e.g. sandbox_secret_key.
     *
     * @return list<string>
     */
    public function credentialFields(): array
    {
        return collect(['sandbox', 'live'])
            ->crossJoin(self::CREDENTIALS[$this->key] ?? [])
            ->map(fn (array $pair) => implode('_', $pair))
            ->all();
    }
}
