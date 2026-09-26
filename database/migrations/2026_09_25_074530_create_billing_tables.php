<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Billings (following the Mentor demo): payment gateway settings, a ledger of payments for courses,
 * exams and products (online, or offline with a proof of transfer), and how payouts were paid.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_gateways', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // stripe|paypal|toyyibpay|offline
            $table->boolean('enabled')->default(false);
            $table->boolean('test_mode')->default(true);
            $table->string('currency', 3)->default('INR');
            $table->text('credentials')->nullable(); // encrypted JSON
            $table->text('instructions')->nullable(); // offline: bank details shown at checkout
            $table->timestamps();
        });

        $now = now();
        DB::table('payment_gateways')->insert(array_map(
            fn (string $key) => ['key' => $key, 'created_at' => $now, 'updated_at' => $now],
            ['stripe', 'paypal', 'toyyibpay', 'offline'],
        ));

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->morphs('payable'); // Course, Exam or Product
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3);
            $table->string('method', 20)->index(); // a gateway key
            $table->string('transaction_id')->nullable();
            $table->string('status', 20)->default('pending')->index(); // pending|paid|rejected
            $table->date('paid_on')->nullable(); // offline: when the customer says they paid
            $table->string('proof_path')->nullable(); // offline: receipt on the private disk
            $table->string('note', 1000)->nullable();
            $table->timestamps();
        });

        Schema::table('payout_requests', function (Blueprint $table) {
            $table->string('payout_method')->nullable()->after('status');
            $table->string('note', 1000)->nullable()->after('payout_method');
            $table->timestamp('processed_at')->nullable()->after('note');
        });
    }

    public function down(): void
    {
        Schema::table('payout_requests', function (Blueprint $table) {
            $table->dropColumn(['payout_method', 'note', 'processed_at']);
        });
        Schema::dropIfExists('payments');
        Schema::dropIfExists('payment_gateways');
    }
};
