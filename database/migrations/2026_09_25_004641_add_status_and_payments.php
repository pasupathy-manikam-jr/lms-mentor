<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Data behind the admin dashboard charts: course status, what each enrolment paid, and instructor payout requests.
     */
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            // Existing courses are live, so they start as approved.
            $table->string('status')->default('approved')->after('level')->index();
        });

        Schema::table('enrollments', function (Blueprint $table) {
            $table->decimal('price_paid', 8, 2)->default(0)->after('course_id');
        });

        Schema::create('payout_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('instructor_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('pending')->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payout_requests');

        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn('price_paid');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn('status');
        });
    }
};
