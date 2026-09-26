<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LocalizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_switching_to_malay_shares_malay_strings()
    {
        $this->from(route('home'))
            ->post(route('locale.update'), ['locale' => 'ms'])
            ->assertRedirect(route('home'));

        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('locale', 'ms')
                ->where('translations.Browse courses', 'Layari kursus'));
    }

    public function test_malay_and_chinese_can_be_chosen()
    {
        foreach (['ms', 'zh'] as $locale) {
            $this->post(route('locale.update'), ['locale' => $locale])->assertSessionHasNoErrors();

            $this->get(route('home'))
                ->assertInertia(fn (Assert $page) => $page
                    ->where('locale', $locale)
                    ->whereType('translations.Browse courses', 'string'));
        }
    }

    public function test_every_locale_translates_the_same_strings_and_server_message_files()
    {
        $keys = array_keys(json_decode(file_get_contents(lang_path('ms.json')), true));

        foreach (['ms', 'zh'] as $locale) {
            $translations = json_decode(file_get_contents(lang_path("{$locale}.json")), true);

            $this->assertEqualsCanonicalizing($keys, array_keys($translations), "lang/{$locale}.json keys differ from lang/ms.json");

            foreach (['auth', 'pagination', 'passwords', 'validation'] as $file) {
                $this->assertFileExists(lang_path("{$locale}/{$file}.php"));
            }
        }
    }

    public function test_english_sends_no_translations_and_unknown_locales_are_rejected()
    {
        $this->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('locale', 'en')
                ->where('translations', []));

        $this->post(route('locale.update'), ['locale' => 'fr'])->assertSessionHasErrors('locale');
        $this->post(route('locale.update'), ['locale' => 'es'])->assertSessionHasErrors('locale');
    }

    public function test_validation_messages_follow_the_chosen_language()
    {
        $this->withSession(['locale' => 'ms'])
            ->post(route('newsletter.subscribe'), ['email' => ''])
            ->assertSessionHasErrors(['email' => 'Medan e-mel diperlukan.']);
    }

    public function test_customizer_cookies_are_applied_to_the_html_tag_and_unsafe_values_dropped()
    {
        $this->withUnencryptedCookies(['theme_color' => 'amber', 'font' => 'inter', 'direction' => 'rtl'])
            ->get(route('home'))
            ->assertSee('data-theme-color="amber"', false)
            ->assertSee('data-font="inter"', false)
            ->assertSee('dir="rtl"', false);

        $this->withUnencryptedCookies(['theme_color' => '"><script>', 'direction' => 'sideways'])
            ->get(route('home'))
            ->assertDontSee('data-theme-color', false)
            ->assertSee('dir="ltr"', false);
    }
}
