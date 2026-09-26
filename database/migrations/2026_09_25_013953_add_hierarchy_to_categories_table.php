<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Subcategories (parent_id), manual ordering (position) and the protected Default category that receives
     * the content of deleted categories.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('id')->constrained('categories')->cascadeOnDelete();
            $table->unsignedInteger('position')->default(0)->after('icon');
            $table->boolean('is_default')->default(false)->after('position');
        });

        DB::table('categories')->update(['position' => DB::raw('id')]);

        DB::table('categories')->insertOrIgnore([
            'name' => 'Default',
            'slug' => 'default',
            'icon' => 'layout-grid',
            'position' => 0,
            'is_default' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('categories')->where('is_default', true)->delete();

        Schema::table('categories', function (Blueprint $table) {
            $table->dropConstrainedForeignId('parent_id');
            $table->dropColumn(['position', 'is_default']);
        });
    }
};
