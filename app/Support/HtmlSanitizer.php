<?php

namespace App\Support;

use Dom\Element;
use Dom\HTMLDocument;
use Dom\Node;
use Dom\Text;

/**
 * Allowlist cleaner for the rich-text editor's HTML. Keeps the tags and attributes the editor produces,
 * drops scripts, event handlers and unsafe URLs, and unwraps anything else.
 */
class HtmlSanitizer
{
    /**
     * Allowed tags and the attributes each may keep.
     *
     * @var array<string, list<string>>
     */
    private const TAGS = [
        'p' => ['style'], 'h1' => ['style'], 'h2' => ['style'], 'h3' => ['style'], 'h4' => ['style'],
        'br' => [], 'hr' => [], 'strong' => [], 'b' => [], 'em' => [], 'i' => [], 'u' => [], 's' => [],
        'code' => [], 'pre' => [], 'blockquote' => [], 'sub' => [], 'sup' => [],
        'ul' => [], 'ol' => ['start'], 'li' => [],
        'span' => ['style'], 'mark' => ['style', 'data-color'],
        'a' => ['href', 'target', 'rel'], 'img' => ['src', 'alt', 'title'],
        'table' => ['style'], 'colgroup' => [], 'col' => ['style'], 'thead' => [], 'tbody' => [], 'tr' => [],
        'th' => ['colspan', 'rowspan', 'colwidth'], 'td' => ['colspan', 'rowspan', 'colwidth'],
        'div' => ['data-youtube-video'], 'iframe' => ['src', 'width', 'height', 'allowfullscreen'],
    ];

    /**
     * Tags removed together with their content.
     */
    private const DROP = ['script', 'style', 'object', 'embed', 'noscript', 'template', 'form', 'input', 'textarea', 'select', 'button', 'svg', 'math', 'head', 'title', 'meta', 'link'];

    /**
     * CSS properties the editor sets (text colour, highlight, alignment, table column widths).
     */
    private const STYLES = ['color', 'background-color', 'text-align', 'min-width', 'width'];

    /**
     * Clean editor HTML. Returns null when nothing visible is left (an empty editor submits "<p></p>").
     */
    public function clean(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return null;
        }

        $document = HTMLDocument::createFromString('<!DOCTYPE html><body>'.$html, LIBXML_NOERROR);
        $body = $document->body;

        $this->cleanChildren($body);

        $clean = trim($body->innerHTML);

        return trim(strip_tags($clean, '<img><iframe>')) === '' ? null : $clean;
    }

    private function cleanChildren(Node $parent): void
    {
        foreach (iterator_to_array($parent->childNodes) as $node) {
            if ($node instanceof Text) {
                continue;
            }

            if (! $node instanceof Element) {
                $node->remove();

                continue;
            }

            $tag = $node->localName;

            if (in_array($tag, self::DROP, true) || ($tag === 'iframe' && ! $this->isYoutubeEmbed($node->getAttribute('src')))) {
                $node->remove();

                continue;
            }

            $this->cleanChildren($node);

            if (! isset(self::TAGS[$tag])) {
                $node->replaceWith(...iterator_to_array($node->childNodes));

                continue;
            }

            $this->cleanAttributes($node, self::TAGS[$tag]);
        }
    }

    /**
     * @param  list<string>  $allowed
     */
    private function cleanAttributes(Element $element, array $allowed): void
    {
        foreach ($element->getAttributeNames() as $name) {
            $value = (string) $element->getAttribute($name);

            $keep = in_array($name, $allowed, true) && match ($name) {
                'href' => (bool) preg_match('~^(https?:|mailto:|/|#)~i', $value),
                'src' => $element->localName === 'iframe' || (bool) preg_match('~^(https?:|/)~i', $value),
                'target' => $value === '_blank',
                'style' => ($value = $this->cleanStyle($value)) !== '',
                'colspan', 'rowspan', 'start', 'width', 'height' => ctype_digit($value),
                default => true,
            };

            $keep ? $element->setAttribute($name, $value) : $element->removeAttribute($name);
        }

        if ($element->localName === 'a' && $element->hasAttribute('target')) {
            $element->setAttribute('rel', 'noopener noreferrer nofollow');
        }
    }

    private function cleanStyle(string $style): string
    {
        $declarations = [];

        foreach (explode(';', $style) as $declaration) {
            [$property, $value] = array_map('trim', explode(':', $declaration, 2) + [1 => '']);
            $property = strtolower($property);

            if (in_array($property, self::STYLES, true) && preg_match('~^[#\w\s(),.%-]+$~', $value) && ! str_contains(strtolower($value), 'url')) {
                $declarations[] = "{$property}: {$value}";
            }
        }

        return implode('; ', $declarations);
    }

    private function isYoutubeEmbed(?string $src): bool
    {
        return (bool) preg_match('~^https://www\.youtube(-nocookie)?\.com/embed/[\w-]+~', (string) $src);
    }
}
