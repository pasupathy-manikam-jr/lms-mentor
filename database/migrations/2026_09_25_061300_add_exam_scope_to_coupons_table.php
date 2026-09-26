<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Coupons are for courses or for exams. A coupon with no course_id/exam_id applies to every item of
     * its kind.
     */
    public function up(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->string('applies_to')->default('course')->after('discount')->index();
            $table->foreignId('exam_id')->nullable()->after('course_id')->constrained()->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('coupons', function (Blueprint $table) {
            $table->dropConstrainedForeignId('exam_id');
            $table->dropColumn('applies_to');
        });
    }
};
