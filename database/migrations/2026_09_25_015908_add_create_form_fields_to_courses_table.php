<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The existing plain-text description becomes the short description; description now holds the
     * rich-text (sanitized HTML) body written in the course editor. New courses start with no lessons,
     * so their duration defaults to 0.
     */
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->renameColumn('description', 'short_description');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->longText('description')->nullable()->after('short_description');
            $table->string('language', 10)->default('en')->after('level');
            $table->string('expiry_type')->default('lifetime')->after('compare_at_price');
            $table->unsignedSmallInteger('expiry_months')->nullable()->after('expiry_type');
            $table->boolean('drip_content')->default(false)->after('expiry_months');
            $table->unsignedInteger('duration_minutes')->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['description', 'language', 'expiry_type', 'expiry_months', 'drip_content']);
            $table->unsignedInteger('duration_minutes')->default(null)->change();
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->renameColumn('short_description', 'description');
        });
    }
};
