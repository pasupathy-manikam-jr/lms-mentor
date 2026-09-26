<?php

namespace Tests\Feature\Admin;

use App\Models\Language;
use App\Models\TranslationOverride;
use App\Models\User;
use Database\Seeders\LandingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TranslationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(LandingSeeder::class);
        $this->admin = User::factory()->admin()->create();
    }

    public function test_edited_lines_reach_pages_and_server_messages_and_reverting_drops_them()
    {
        $this->actingAs($this->admin)->put(route('admin.languages.lines', 'ms'), ['lines' => [
            ['key' => 'Browse courses', 'value' => 'Lihat semua kursus'],
            ['key' => "Thanks! You're on the list.", 'value' => 'Terima kasih, anda sudah dalam senarai!'],
        ]])->assertSessionHasNoErrors();

        $this->withSession(['locale' => 'ms'])->get(route('home'))
            ->assertInertia(fn (Assert $page) => $page->where('translations.Browse courses', 'Lihat semua kursus'));

        auth()->logout();
        $this->withSession(['locale' => 'ms'])->post(route('newsletter.subscribe'), ['email' => 'a@example.com'])
            ->assertSessionHas('inertia.flash_data.toast.message', 'Terima kasih, anda sudah dalam senarai!');

        // Setting a line back to the shipped wording (or emptying it) removes the override.
        $shipped = json_decode(file_get_contents(lang_path('ms.json')), true)['Browse courses'];
        $this->actingAs($this->admin)->put(route('admin.languages.lines', 'ms'), ['lines' => [['key' => 'Browse courses', 'value' => $shipped]]]);
        $this->assertSame(1, TranslationOverride::count());

        $this->put(route('admin.languages.lines', 'ms'), ['lines' => [['key' => 'Not a real string', 'value' => 'x']]])->assertStatus(422);
    }

    public function test_the_editor_lists_lines_with_search_and_untranslated_filter()
    {
        Language::create(['code' => 'ta', 'name' => 'தமிழ்', 'is_active' => false]);

        $this->actingAs($this->admin)
            ->get(route('admin.languages.edit', ['language' => 'ta', 'missing' => 1]))
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/languages/edit')
                ->where('progress.translated', 0)
                ->where('lines.total', $page->toArray()['props']['progress']['total']));

        $this->get(route('admin.languages.edit', ['language' => 'ms', 'search' => 'browse courses']))
            ->assertInertia(fn (Assert $page) => $page->where('lines.data.0.key', 'Browse courses'));
    }

    public function test_languages_are_switched_on_off_made_default_and_deleted_safely()
    {
        $this->actingAs($this->admin);
        $this->post(route('admin.languages.store'), ['code' => 'ta', 'name' => 'தமிழ்', 'flag' => '🇮🇳'])->assertSessionHasNoErrors();
        $tamil = Language::firstWhere('code', 'ta');
        $this->assertFalse($tamil->is_active);

        // An inactive language can't be chosen; switched on, it can.
        $this->post(route('locale.update'), ['locale' => 'ta'])->assertSessionHasErrors('locale');
        $this->patch(route('admin.languages.update', $tamil), ['is_active' => true]);
        $this->post(route('locale.update'), ['locale' => 'ta'])->assertSessionHasNoErrors();

        // A new default is used by visitors who haven't picked a language.
        $malay = Language::firstWhere('code', 'ms');
        $this->post(route('admin.languages.default', $malay));
        auth()->logout();
        $this->flushSession();
        $this->get(route('home'))->assertInertia(fn (Assert $page) => $page->where('locale', 'ms'));

        $this->actingAs($this->admin);
        $this->patch(route('admin.languages.update', $malay), ['is_active' => false])->assertForbidden();
        $this->delete(route('admin.languages.destroy', $malay))->assertForbidden();
        $this->delete(route('admin.languages.destroy', Language::firstWhere('code', 'en')))->assertForbidden();
        $this->delete(route('admin.languages.destroy', $tamil));
        $this->assertModelMissing($tamil);

        $this->actingAs(User::factory()->create())->get(route('admin.languages.index'))->assertForbidden();
    }
}
