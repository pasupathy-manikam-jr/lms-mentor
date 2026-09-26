<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Prices are set in the site currency (USD). A gateway that charges in another currency, such as
 * ToyyibPay in MYR, converts with the rate an admin enters: 1 USD = exchange_rate units.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_gateways', function (Blueprint $table) {
            $table->decimal('exchange_rate', 12, 6)->nullable()->after('currency');
        });
    }

    public function down(): void
    {
        Schema::table('payment_gateways', function (Blueprint $table) {
            $table->dropColumn('exchange_rate');
        });
    }
};
