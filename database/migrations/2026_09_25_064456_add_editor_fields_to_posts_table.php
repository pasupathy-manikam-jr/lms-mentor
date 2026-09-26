<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * The admin blog editor (following the Mentor demo): keywords, a banner, and a rich-text body. Existing
 * plain-text bodies become one <p> per paragraph.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('keywords', 1000)->nullable()->after('excerpt');
            $table->string('banner_url')->nullable()->after('image_url');
        });

        DB::table('posts')->whereNotNull('body')->lazyById()->each(fn (object $post) => DB::table('posts')->where('id', $post->id)->update([
            'body' => Str::of($post->body)->trim()->split('/\n\s*\n/')
                ->map(fn (string $paragraph) => '<p>'.e(trim($paragraph)).'</p>')
                ->implode(''),
        ]));
    }

    public function down(): void
    {
        DB::table('posts')->whereNotNull('body')->lazyById()->each(fn (object $post) => DB::table('posts')->where('id', $post->id)->update([
            'body' => html_entity_decode(trim(strip_tags(str_replace('</p>', "\n\n", $post->body)))),
        ]));

        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['keywords', 'banner_url']);
        });
    }
};
