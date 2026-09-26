<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The editor's Media tab: a banner image and a preview video (a YouTube/Vimeo link or an uploaded
     * file) shown to visitors on the course page.
     */
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->string('banner_url')->nullable()->after('image_url');
            $table->string('preview_type')->nullable()->after('banner_url');
            $table->string('preview_source', 2048)->nullable()->after('preview_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['banner_url', 'preview_type', 'preview_source']);
        });
    }
};
