<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Quiz settings from the Add quiz form. A quiz's summary is kept in `body`, and its duration_minutes
     * is the time limit rounded up, for the curriculum lists.
     */
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->unsignedInteger('time_limit_seconds')->nullable()->after('duration_minutes');
            $table->unsignedSmallInteger('total_mark')->nullable()->after('time_limit_seconds');
            $table->unsignedSmallInteger('pass_mark')->nullable()->after('total_mark');
            $table->unsignedSmallInteger('retake_attempts')->nullable()->after('pass_mark');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn(['time_limit_seconds', 'total_mark', 'pass_mark', 'retake_attempts']);
        });
    }
};
