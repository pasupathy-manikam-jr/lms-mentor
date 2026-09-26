<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fields for the exam editor. The plain-text description becomes the short description, and
     * description now holds sanitized rich text. Existing exams are published.
     */
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->renameColumn('description', 'short_description');
        });

        Schema::table('exams', function (Blueprint $table) {
            $table->longText('description')->nullable()->after('short_description');
            $table->string('status')->default('published')->after('level')->index();
            $table->unsignedSmallInteger('total_marks')->default(100)->after('pass_percentage');
            $table->string('expiry_type')->default('lifetime')->after('compare_at_price');
            $table->unsignedSmallInteger('expiry_months')->nullable()->after('expiry_type');
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
        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn(['description', 'status', 'total_marks', 'expiry_type', 'expiry_months', 'meta_title', 'meta_keywords', 'meta_description', 'og_title', 'og_description']);
        });

        Schema::table('exams', function (Blueprint $table) {
            $table->renameColumn('short_description', 'description');
        });
    }
};
