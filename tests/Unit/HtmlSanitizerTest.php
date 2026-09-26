<?php

namespace Tests\Unit;

use App\Support\HtmlSanitizer;
use PHPUnit\Framework\TestCase;

class HtmlSanitizerTest extends TestCase
{
    public function test_editor_markup_is_kept()
    {
        $html = '<h2 style="text-align: center">Title</h2><p><span style="color: #dc2626">red</span> <mark data-color="#fef08a" style="background-color: #fef08a; color: inherit">marked</mark></p>'
            .'<ul><li><p>one</p></li></ul><table style="min-width: 75px"><colgroup><col style="min-width: 25px"></colgroup><tbody><tr><th colspan="1" rowspan="1"><p>A</p></th></tr></tbody></table>'
            .'<div data-youtube-video=""><iframe width="640" height="480" allowfullscreen="true" src="https://www.youtube-nocookie.com/embed/abc123"></iframe></div>'
            .'<p><a target="_blank" rel="noopener" href="https://example.com">link</a><img src="/storage/editor/a.png" alt="A"></p>';

        $clean = (new HtmlSanitizer)->clean($html);

        $this->assertStringContainsString('<h2 style="text-align: center">Title</h2>', $clean);
        $this->assertStringContainsString('<span style="color: #dc2626">red</span>', $clean);
        $this->assertStringContainsString('style="background-color: #fef08a; color: inherit"', $clean);
        $this->assertStringContainsString('<th colspan="1" rowspan="1">', $clean);
        $this->assertStringContainsString('src="https://www.youtube-nocookie.com/embed/abc123"', $clean);
        $this->assertStringContainsString('rel="noopener noreferrer nofollow"', $clean);
        $this->assertStringContainsString('<img src="/storage/editor/a.png" alt="A">', $clean);
    }

    public function test_scripts_handlers_and_unsafe_urls_are_removed()
    {
        $clean = (new HtmlSanitizer)->clean(
            '<p onclick="x()" style="position: fixed; color: red; background: url(evil)">Hi<script>alert(1)</script></p>'
            .'<a href="javascript:alert(1)">bad</a><img src="data:image/svg+xml,x" onerror="x()">'
            .'<iframe src="https://evil.test/embed/x"></iframe><font color="red">plain</font><!-- note -->',
        );

        $this->assertSame('<p style="color: red">Hi</p><a>bad</a><img>plain', $clean);
    }

    public function test_empty_editor_output_becomes_null()
    {
        $sanitizer = new HtmlSanitizer;

        $this->assertNull($sanitizer->clean('<p></p>'));
        $this->assertNull($sanitizer->clean('  '));
        $this->assertNull($sanitizer->clean(null));
    }
}
