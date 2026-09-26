<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Course quizzes reuse the exam engine: a question or an attempt belongs to an exam or to a quiz lesson.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_questions', function (Blueprint $table) {
            $table->foreignId('exam_id')->nullable()->change();
            $table->foreignId('lesson_id')->nullable()->after('exam_id')->constrained()->cascadeOnDelete();
        });

        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->foreignId('exam_id')->nullable()->change();
            $table->foreignId('lesson_id')->nullable()->after('exam_id')->constrained()->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('exam_attempts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('lesson_id');
        });

        Schema::table('exam_questions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('lesson_id');
        });
    }
};
