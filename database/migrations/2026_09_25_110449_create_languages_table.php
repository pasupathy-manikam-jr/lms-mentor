<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Translation (following the Mentor demo): the site's languages, and wording an admin changes in the
 * browser. Changes are kept here, not written into lang/*.json, so they survive deploys.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('languages', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name');
            $table->string('flag', 16)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        Schema::create('translation_overrides', function (Blueprint $table) {
            $table->id();
            $table->string('locale', 10)->index();
            $table->char('key_hash', 40); // sha1 of the key, for the unique index
            $table->text('key'); // the English text
            $table->text('value');
            $table->timestamps();

            $table->unique(['locale', 'key_hash']);
        });

        $now = now();
        DB::table('languages')->insert([
            ['code' => 'en', 'name' => 'English', 'flag' => '🇬🇧', 'is_default' => true, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'ms', 'name' => 'Bahasa Melayu', 'flag' => '🇲🇾', 'is_default' => false, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'zh', 'name' => '中文（简体）', 'flag' => '🇨🇳', 'is_default' => false, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('translation_overrides');
        Schema::dropIfExists('languages');
    }
};
