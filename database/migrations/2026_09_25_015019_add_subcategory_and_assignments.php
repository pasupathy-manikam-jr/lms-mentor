<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A course's optional subcategory, and its assignments (only what the course list needs; the assignments
     * feature will extend this table).
     */
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->foreignId('subcategory_id')->nullable()->after('category_id')->constrained('categories')->nullOnDelete();
        });

        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assignments');

        Schema::table('courses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('subcategory_id');
        });
    }
};
