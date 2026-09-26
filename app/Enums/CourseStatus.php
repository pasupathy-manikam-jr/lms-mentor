<?php

namespace App\Enums;

/**
 * Publication state of a course. Only approved courses appear on the public site.
 */
enum CourseStatus: string
{
    case Approved = 'approved';
    case Upcoming = 'upcoming';
    case Pending = 'pending';
    case Private = 'private';
    case Draft = 'draft';
}
