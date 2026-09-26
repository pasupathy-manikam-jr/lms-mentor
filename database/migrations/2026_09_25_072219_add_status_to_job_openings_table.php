<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Job Circulars admin (following the Mentor demo): a draft/active/closed status, and a rich-text
 * description. Existing plain-text descriptions become one <p> per paragraph.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_openings', function (Blueprint $table) {
            $table->string('status', 20)->default('active')->index()->after('slug');
        });

        DB::table('job_openings')->lazyById()->each(fn (object $job) => DB::table('job_openings')->where('id', $job->id)->update([
            'description' => collect(preg_split('/\n\s*\n/', trim($job->description)))
                ->map(fn (string $paragraph) => '<p>'.e(trim($paragraph)).'</p>')
                ->implode(''),
        ]));
    }

    public function down(): void
    {
        DB::table('job_openings')->lazyById()->each(fn (object $job) => DB::table('job_openings')->where('id', $job->id)->update([
            'description' => html_entity_decode(trim(strip_tags(str_replace('</p>', "\n\n", $job->description)))),
        ]));

        Schema::table('job_openings', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
