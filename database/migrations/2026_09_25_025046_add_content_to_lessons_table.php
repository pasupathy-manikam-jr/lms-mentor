<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lesson content: its kind, where it lives (a private file path or a URL), the rich-text body for
     * text lessons, and a short description shown under it in the player.
     */
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->string('content_type')->nullable()->after('type');
            $table->string('source', 2048)->nullable()->after('content_type');
            $table->longText('body')->nullable()->after('source');
            $table->text('description')->nullable()->after('body');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn(['content_type', 'source', 'body', 'description']);
        });
    }
};
