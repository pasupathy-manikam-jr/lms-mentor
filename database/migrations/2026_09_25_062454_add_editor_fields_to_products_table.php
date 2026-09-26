<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fields for the product editor. The plain-text description becomes the summary, and description
     * holds sanitized rich text. Existing products are published with unlimited stock.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->renameColumn('description', 'summary');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->longText('description')->nullable()->after('summary');
            $table->string('status')->default('published')->after('format')->index();
            $table->unsignedInteger('stock')->nullable()->after('compare_at_price');
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
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['description', 'status', 'stock', 'meta_title', 'meta_keywords', 'meta_description', 'og_title', 'og_description']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->renameColumn('summary', 'description');
        });
    }
};
