<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Settings (following the Mentor demo): site details, mail server, sign-ups and analytics, one row
 * per section. Secrets inside are encrypted by the model.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('section')->unique(); // system|smtp|auth|analytics
            $table->text('values'); // encrypted JSON
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
