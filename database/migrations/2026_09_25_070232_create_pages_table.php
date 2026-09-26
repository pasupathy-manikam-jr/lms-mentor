<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Frontend → Pages: the built-in site pages (whose designed sections have editable text) and custom
 * rich-text pages created by admins.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('kind', 20)->default('custom'); // home|about|team|careers|custom
            $table->json('content')->nullable(); // built-in pages: text that replaces a section's default wording
            $table->longText('body')->nullable(); // custom pages: sanitized rich-text HTML
            $table->boolean('is_published')->default(true);
            $table->string('meta_title')->nullable();
            $table->string('meta_description', 1000)->nullable();
            $table->string('og_image_url')->nullable();
            $table->timestamps();
        });

        $now = now();
        DB::table('pages')->insert(array_map(fn (array $page) => [...$page, 'created_at' => $now, 'updated_at' => $now], [
            ['slug' => 'home', 'title' => 'Home', 'kind' => 'home'],
            ['slug' => 'about-us', 'title' => 'About Us', 'kind' => 'about'],
            ['slug' => 'our-team', 'title' => 'Our Team', 'kind' => 'team'],
            ['slug' => 'careers', 'title' => 'Careers', 'kind' => 'careers'],
        ]));
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
