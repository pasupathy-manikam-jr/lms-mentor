<?php

namespace App\Enums;

/**
 * Kind of curriculum item. Lessons and quizzes share one ordered list per section; only lessons count
 * towards a course's duration and lesson total.
 */
enum LessonType: string
{
    case Lesson = 'lesson';
    case Quiz = 'quiz';
}
