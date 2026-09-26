<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The editor's SEO tab: search and social sharing tags for the course page. Empty fields fall back
     * to the course title and short description.
     */
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->string('meta_title')->nullable();
            $table->text('meta_keywords')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('og_title')->nullable();
            $table->text('og_description')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['meta_title', 'meta_keywords', 'meta_description', 'og_title', 'og_description']);
        });
    }
};
