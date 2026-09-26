<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A student's go at an exam: their answers, the marks per question, and the result. Short answers are
 * marked by an admin, so an attempt with any waits for review before it has a result.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->timestamp('started_at');
            $table->timestamp('ends_at');
            $table->timestamp('submitted_at')->nullable();
            $table->json('answers')->nullable(); // question id => answer
            $table->json('marks')->nullable(); // question id => marks awarded (null = waiting for review)
            $table->decimal('score', 8, 2)->nullable();
            $table->decimal('total_marks', 8, 2)->default(0);
            $table->boolean('needs_review')->default(false)->index();
            $table->boolean('passed')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'exam_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_attempts');
    }
};
