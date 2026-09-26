<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Instructors admin (following the Mentor demo): an instructor can belong to a user account and goes
 * through an application (pending → approved or rejected), with a resume, skills and biography.
 * Existing profiles stay approved and without an account.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('instructors', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->unique()->after('id')->constrained()->nullOnDelete();
            $table->string('status', 20)->default('approved')->index()->after('user_id');
            $table->json('skills')->nullable()->after('avatar_url');
            $table->text('biography')->nullable()->after('skills');
            $table->string('resume_path')->nullable()->after('biography');
            $table->string('resume_name')->nullable()->after('resume_path');
        });
    }

    public function down(): void
    {
        Schema::table('instructors', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn(['status', 'skills', 'biography', 'resume_path', 'resume_name']);
        });
    }
};
