<?php

namespace App\Enums;

/**
 * Publication state of a store product. Only published products appear on the public site.
 */
enum ProductStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Archived = 'archived';
}
