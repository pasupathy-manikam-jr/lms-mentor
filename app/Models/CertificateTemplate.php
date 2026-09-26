<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * A certificate or marksheet design (Certificate → Certificate / Marksheet). The student's name,
 * the course and the date are filled in when it is shown; `content` holds the admin's wording.
 *
 * @property int $id
 * @property string $kind certificate|marksheet
 * @property string $type course|exam
 * @property string $name
 * @property string $design classic|academic|elegant|modern
 * @property array{primary: string, accent: string, background: string, text: string} $colors
 * @property array<string, string|null> $content
 * @property bool $is_active
 */
#[Fillable(['kind', 'type', 'name', 'design', 'colors', 'content', 'is_active'])]
class CertificateTemplate extends Model
{
    public const KINDS = ['certificate', 'marksheet'];

    public const TYPES = ['course', 'exam'];

    public const DESIGNS = ['classic', 'academic', 'elegant', 'modern'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'colors' => 'array',
            'content' => 'array',
            'is_active' => 'boolean',
        ];
    }

    /**
     * The template students get for this kind and type, if any.
     */
    public static function activeFor(string $kind, string $type): ?self
    {
        return static::where(['kind' => $kind, 'type' => $type, 'is_active' => true])->first();
    }

    /**
     * Make this the only active template of its kind and type.
     */
    public function activate(): void
    {
        DB::transaction(function () {
            static::where(['kind' => $this->kind, 'type' => $this->type])->whereKeyNot($this->id)->update(['is_active' => false]);
            $this->update(['is_active' => true]);
        });
    }
}
