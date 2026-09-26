<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A folder in the Media Library. Deleting it keeps its files, which move to "All items".
 *
 * @property int $id
 * @property string $name
 */
#[Fillable(['name'])]
class MediaFolder extends Model
{
    /**
     * @return HasMany<Media, $this>
     */
    public function media(): HasMany
    {
        return $this->hasMany(Media::class);
    }
}
