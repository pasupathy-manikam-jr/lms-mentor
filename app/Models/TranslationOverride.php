<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * Interface text an admin changed in Translation, replacing the language file's line for one locale.
 *
 * @property int $id
 * @property string $locale
 * @property string $key_hash
 * @property string $key The English text.
 * @property string $value
 */
#[Fillable(['locale', 'key_hash', 'key', 'value'])]
class TranslationOverride extends Model {}
