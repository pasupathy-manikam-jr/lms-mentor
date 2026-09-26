<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $user_id Who wrote it in the dashboard (instructors see only their own).
 * @property int|null $category_id
 * @property string $title
 * @property string $slug
 * @property string|null $excerpt
 * @property string|null $keywords
 * @property string|null $body Sanitized rich-text HTML.
 * @property string|null $image_url Thumbnail, shown on blog cards.
 * @property string|null $banner_url Shown at the top of the post; falls back to the thumbnail.
 * @property string $author_name
 * @property int $read_minutes
 * @property Carbon|null $published_at
 */
#[Fillable(['user_id', 'category_id', 'title', 'slug', 'excerpt', 'keywords', 'body', 'image_url', 'banner_url', 'author_name', 'read_minutes', 'published_at'])]
class Post extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
        ];
    }

    /**
     * @param  Builder<Post>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->whereNotNull('published_at')->where('published_at', '<=', now());
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
