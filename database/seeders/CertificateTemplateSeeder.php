<?php

namespace Database\Seeders;

use App\Models\CertificateTemplate;
use Illuminate\Database\Seeder;

/**
 * Starter certificate and marksheet templates, one per design, with the first of each group active.
 * Safe to run more than once.
 */
class CertificateTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $palettes = [
            'classic' => ['primary' => '#a67c1a', 'accent' => '#d8b366', 'background' => '#fdfaf3', 'text' => '#4a3d26'],
            'academic' => ['primary' => '#1a3a5c', 'accent' => '#8ba8c0', 'background' => '#f5f8fb', 'text' => '#1f2937'],
            'elegant' => ['primary' => '#7a4b12', 'accent' => '#e2b25c', 'background' => '#fbf5e8', 'text' => '#3f3222'],
            'modern' => ['primary' => '#0f766e', 'accent' => '#99f6e4', 'background' => '#ffffff', 'text' => '#111827'],
        ];

        $templates = [
            // [kind, type, name, design, palette, content]
            ['certificate', 'course', 'Classic Gold', 'classic', 'classic', ['title' => 'Certificate of Completion', 'subtitle' => 'has successfully completed']],
            ['certificate', 'course', 'Academic Navy', 'academic', 'academic', ['title' => 'Certificate of Completion', 'subtitle' => 'has successfully completed']],
            ['certificate', 'course', 'Elegant Ivory', 'elegant', 'elegant', ['title' => 'Certificate of Training', 'subtitle' => 'has successfully completed the training programme']],
            ['certificate', 'course', 'Modern Teal', 'modern', 'modern', ['title' => 'Certificate of Participation', 'subtitle' => 'has participated in']],
            ['certificate', 'exam', 'Exam Achievement', 'classic', 'classic', ['title' => 'Certificate of Achievement', 'subtitle' => 'has passed the examination']],
            ['certificate', 'exam', 'Exam Excellence', 'modern', 'academic', ['title' => 'Certificate of Excellence', 'subtitle' => 'has passed with distinction']],
            ['marksheet', 'course', 'Classic Marksheet', 'classic', 'academic', ['title' => 'Academic Marksheet', 'footer' => 'This is an official academic record']],
            ['marksheet', 'course', 'Elegant Marksheet', 'elegant', 'elegant', ['title' => 'Course Performance Report', 'footer' => 'Certified record of academic achievement']],
            ['marksheet', 'course', 'Modern Marksheet', 'modern', 'modern', ['title' => 'Course Marksheet', 'footer' => 'This is an official academic record']],
        ];

        $seen = [];

        foreach ($templates as [$kind, $type, $name, $design, $palette, $content]) {
            $template = CertificateTemplate::firstOrCreate(['kind' => $kind, 'type' => $type, 'name' => $name], [
                'design' => $design,
                'colors' => $palettes[$palette],
                'content' => [...$content, 'organization' => config('app.name'), 'signatory' => null],
            ]);

            if (! isset($seen["{$kind}.{$type}"]) && ! CertificateTemplate::activeFor($kind, $type)) {
                $template->activate();
            }

            $seen["{$kind}.{$type}"] = true;
        }
    }
}
