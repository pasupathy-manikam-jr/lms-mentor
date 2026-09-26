<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * A site page managed from Frontend → Pages. Built-in pages (kind home, about, team, careers) keep
 * their design; `content` holds admin wording that replaces a section's default text, keyed as in
 * resources/js/lib/page-content.ts. Custom pages (kind custom) are a rich-text body at /pages/{slug}.
 *
 * @property int $id
 * @property string $slug
 * @property string $title
 * @property string $kind
 * @property array<string, string>|null $content
 * @property array{instructors?: list<int>, posts?: list<int>}|null $collections Home page only: picked instructor and post ids.
 * @property string|null $body
 * @property bool $is_published
 * @property string|null $meta_title
 * @property string|null $meta_description
 * @property string|null $og_image_url
 */
#[Fillable(['slug', 'title', 'kind', 'content', 'collections', 'body', 'is_published', 'meta_title', 'meta_description', 'og_image_url'])]
class Page extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'content' => 'array',
            'collections' => 'array',
            'is_published' => 'boolean',
        ];
    }

    public function isBuiltIn(): bool
    {
        return $this->kind !== 'custom';
    }

    /**
     * What a built-in page's view needs: the admin's wording and SEO fields. Empty when the row is missing.
     *
     * @return array{content: object, meta_title: ?string, meta_description: ?string, og_image_url: ?string}
     */
    public static function propsFor(string $slug): array
    {
        $page = static::firstWhere('slug', $slug);

        return [
            'content' => (object) ($page->content ?? []),
            'meta_title' => $page?->meta_title,
            'meta_description' => $page?->meta_description,
            'og_image_url' => $page?->og_image_url,
        ];
    }
}
