<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Instructor Revenue Share
    |--------------------------------------------------------------------------
    |
    | Percentage of each course sale that goes to the instructor. The rest is
    | admin (platform) revenue, which the dashboard charts per month.
    |
    */

    'instructor_revenue_share' => (int) env('LMS_INSTRUCTOR_REVENUE_SHARE', 70),

    /*
    |--------------------------------------------------------------------------
    | Course Languages
    |--------------------------------------------------------------------------
    |
    | Languages a course can be taught in, keyed by language code. These are
    | teaching languages, separate from the interface locales in app.php.
    |
    */

    'course_languages' => [
        'en' => 'English',
        'ms' => 'Malay',
        'hi' => 'Hindi',
        'ta' => 'Tamil',
        'te' => 'Telugu',
        'kn' => 'Kannada',
        'ml' => 'Malayalam',
        'mr' => 'Marathi',
        'bn' => 'Bengali',
        'sa' => 'Sanskrit',
        'es' => 'Spanish',
        'fr' => 'French',
        'de' => 'German',
        'ar' => 'Arabic',
        'zh' => 'Mandarin Chinese',
    ],

];
