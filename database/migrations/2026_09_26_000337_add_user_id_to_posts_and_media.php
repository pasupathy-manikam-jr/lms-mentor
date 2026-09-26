<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Instructors manage their own blog posts and media files, so both record who created them. Existing
 * rows have none and are managed by admins. Instructors also keep their payout details.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        Schema::table('media', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        Schema::table('instructors', function (Blueprint $table) {
            $table->text('payout_details')->nullable()->after('resume_name');
        });
    }

    public function down(): void
    {
        Schema::table('instructors', fn (Blueprint $table) => $table->dropColumn('payout_details'));
        Schema::table('media', fn (Blueprint $table) => $table->dropConstrainedForeignId('user_id'));
        Schema::table('posts', fn (Blueprint $table) => $table->dropConstrainedForeignId('user_id'));
    }
};
