<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Exam questions of several types. Options and the answer key are JSON whose shape depends on the
     * type (see App\Enums\QuestionType).
     */
    public function up(): void
    {
        Schema::create('exam_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->text('title');
            $table->text('description')->nullable();
            $table->json('options')->nullable();
            $table->json('answer');
            $table->decimal('marks', 6, 2);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->index(['exam_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_questions');
    }
};
