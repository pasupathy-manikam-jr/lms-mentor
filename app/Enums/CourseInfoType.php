<?php

namespace App\Enums;

/**
 * The three lists in the course editor's Info tab.
 */
enum CourseInfoType: string
{
    case Faq = 'faq';
    case Requirement = 'requirement';
    case Outcome = 'outcome';
}
