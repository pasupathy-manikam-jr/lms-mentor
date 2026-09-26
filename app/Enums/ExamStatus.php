<?php

namespace App\Enums;

/**
 * Publication state of an exam. Only published exams appear on the public site.
 */
enum ExamStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';
}
