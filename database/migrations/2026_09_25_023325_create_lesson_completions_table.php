<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Which curriculum items each learner has completed in the course player, and when a learner
     * finished a whole course.
     */
    public function up(): void
    {
        Schema::create('lesson_completions', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['user_id', 'lesson_id']);
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->timestamp('completed_at')->nullable()->after('price_paid');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn('completed_at');
        });

        Schema::dropIfExists('lesson_completions');
    }
};
