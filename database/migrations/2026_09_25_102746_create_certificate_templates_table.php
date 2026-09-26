<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Certificate and marksheet templates (following the Mentor demo): a design with colours and wording.
 * One template per kind and type (e.g. course certificates) is active and used for students.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certificate_templates', function (Blueprint $table) {
            $table->id();
            $table->string('kind', 20); // certificate|marksheet
            $table->string('type', 20); // course|exam
            $table->string('name');
            $table->string('design', 20); // classic|academic|elegant|modern
            $table->json('colors');
            $table->json('content');
            $table->boolean('is_active')->default(false);
            $table->timestamps();

            $table->index(['kind', 'type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_templates');
    }
};
