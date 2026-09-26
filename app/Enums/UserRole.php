<?php

namespace App\Enums;

/**
 * Role names, backed by spatie/laravel-permission roles of the same name.
 */
enum UserRole: string
{
    case Admin = 'admin';
    case Instructor = 'instructor';
    case Student = 'student';
}
