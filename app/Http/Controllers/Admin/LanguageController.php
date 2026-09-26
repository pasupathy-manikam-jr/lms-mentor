<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Language;
use App\Models\TranslationOverride;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Translation, following the Mentor demo: the site's languages (default, on or off, add, remove) and
 * an editor for each language's interface text. Edits are stored as overrides of lang/{code}.json.
 */
class LanguageController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/languages/index', [
            'languages' => Language::orderBy('id')->get()->map(fn (Language $language) => [
                ...$language->only(['id', 'code', 'name', 'flag', 'is_active', 'is_default']),
                'overrides_count' => TranslationOverride::where('locale', $language->code)->count(),
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Language::create([...$request->validate([
            'code' => ['required', 'string', 'max:10', 'regex:/^[a-z]{2,3}(-[A-Za-z0-9]{2,4})?$/', Rule::unique('languages', 'code')],
            'name' => ['required', 'string', 'max:100'],
            'flag' => ['nullable', 'string', 'max:16'],
        ]), 'is_active' => false]);

        return $this->done(__('Language added. Translate it, then switch it on.'));
    }

    public function update(Request $request, Language $language): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'flag' => ['sometimes', 'nullable', 'string', 'max:16'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        // The default language is always on.
        abort_if($language->is_default && ($validated['is_active'] ?? true) === false, 403);

        $language->update($validated);

        return $this->done(__('Language updated.'));
    }

    public function makeDefault(Language $language): RedirectResponse
    {
        DB::transaction(function () use ($language) {
            Language::whereKeyNot($language->id)->update(['is_default' => false]);
            $language->update(['is_default' => true, 'is_active' => true]);
        });

        return $this->done(__(':name is now the default language.', ['name' => $language->name]));
    }

    /**
     * English is the source text and the default language is in use, so neither can be removed.
     */
    public function destroy(Language $language): RedirectResponse
    {
        abort_if($language->code === 'en' || $language->is_default, 403);

        $language->delete();

        return $this->done(__('Language deleted.'));
    }

    /**
     * The translation editor: every interface string (the English text) with this language's wording.
     */
    public function edit(Request $request, Language $language): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:200'],
            'missing' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $lines = Language::lines($language->code);
        $overrides = Language::overrides($language->code);
        $search = mb_strtolower($filters['search'] ?? '');

        $rows = collect($this->sourceKeys())
            ->map(fn (string $key) => [
                'key' => $key,
                'value' => $lines[$key] ?? '',
                'is_changed' => array_key_exists($key, $overrides),
            ])
            ->when($search !== '', fn ($rows) => $rows->filter(fn (array $row) => str_contains(mb_strtolower($row['key']), $search)
                || str_contains(mb_strtolower($row['value']), $search)))
            ->when($request->boolean('missing'), fn ($rows) => $rows->filter(fn (array $row) => $row['value'] === ''))
            ->values();

        $page = (int) ($filters['page'] ?? 1);
        $perPage = 25;

        return Inertia::render('admin/languages/edit', [
            'language' => $language->only(['id', 'code', 'name', 'flag']),
            'lines' => (new LengthAwarePaginator($rows->forPage($page, $perPage)->values(), $rows->count(), $perPage, $page, [
                'path' => $request->url(),
                'query' => $request->query(),
            ])),
            'filters' => $filters,
            'progress' => [
                'total' => count($this->sourceKeys()),
                'translated' => collect($this->sourceKeys())->filter(fn (string $key) => filled($lines[$key] ?? null))->count(),
            ],
        ]);
    }

    /**
     * Save changed lines. A line set back to the language file's wording, or emptied, drops the override.
     */
    public function saveLines(Request $request, Language $language): RedirectResponse
    {
        $validated = $request->validate([
            'lines' => ['required', 'array', 'max:200'],
            'lines.*.key' => ['required', 'string', 'max:5000'],
            'lines.*.value' => ['nullable', 'string', 'max:5000'],
        ]);

        $sourceKeys = array_flip($this->sourceKeys());
        $path = lang_path("{$language->code}.json");
        $file = $language->code !== 'en' && is_file($path) ? (json_decode((string) file_get_contents($path), true) ?? []) : [];

        foreach ($validated['lines'] as ['key' => $key, 'value' => $value]) {
            abort_unless(isset($sourceKeys[$key]), 422);
            $value = trim((string) $value);
            $where = ['locale' => $language->code, 'key_hash' => sha1($key)];

            if ($value === '' || $value === ($file[$key] ?? ($language->code === 'en' ? $key : null))) {
                TranslationOverride::where($where)->delete();
            } else {
                TranslationOverride::updateOrCreate($where, ['key' => $key, 'value' => $value]);
            }
        }

        Cache::forget("translation_overrides.{$language->code}");

        return $this->done(__('Translations saved.'));
    }

    /**
     * Every interface string, keyed by its English text: the shipped translation files share one key set.
     *
     * @return list<string>
     */
    private function sourceKeys(): array
    {
        return once(fn () => array_keys(json_decode((string) file_get_contents(lang_path('ms.json')), true) ?? []));
    }

    private function done(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
