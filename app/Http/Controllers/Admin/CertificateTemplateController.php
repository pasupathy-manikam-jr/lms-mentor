<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CertificateTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Certificate → Certificate and Marksheet, following the Mentor demo: template galleries grouped by
 * course and exam, with one active template per group, and an editor with a live preview.
 */
class CertificateTemplateController extends Controller
{
    public function index(Request $request): Response
    {
        $kind = $this->kind($request);

        return Inertia::render('admin/certificates/index', [
            'kind' => $kind,
            'templates' => CertificateTemplate::where('kind', $kind)->orderBy('type')->orderBy('id')->get()->groupBy('type'),
        ]);
    }

    public function create(Request $request): Response
    {
        $kind = $this->kind($request);

        return Inertia::render('admin/certificates/form', ['kind' => $kind, 'template' => null]);
    }

    public function store(Request $request): RedirectResponse
    {
        $kind = $this->kind($request);
        $template = CertificateTemplate::create([...$this->validated($request, $kind), 'kind' => $kind]);

        if (! CertificateTemplate::activeFor($kind, $template->type)) {
            $template->activate();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Template created.')]);

        return to_route("admin.certificates.{$kind}.index");
    }

    public function edit(Request $request, CertificateTemplate $template): Response
    {
        $kind = $this->kind($request);
        abort_unless($template->kind === $kind, 404);

        return Inertia::render('admin/certificates/form', ['kind' => $kind, 'template' => $template]);
    }

    public function update(Request $request, CertificateTemplate $template): RedirectResponse
    {
        $kind = $this->kind($request);
        abort_unless($template->kind === $kind, 404);

        $validated = $this->validated($request, $kind);
        $typeChanged = $validated['type'] !== $template->type;
        $template->update([...$validated, 'is_active' => $typeChanged ? false : $template->is_active]);

        if ($typeChanged && ! CertificateTemplate::activeFor($kind, $template->type)) {
            $template->activate();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Template saved.')]);

        return back();
    }

    public function activate(Request $request, CertificateTemplate $template): RedirectResponse
    {
        $kind = $this->kind($request);
        abort_unless($template->kind === $kind, 404);

        $template->activate();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name is now the active template.', ['name' => $template->name])]);

        return back();
    }

    /**
     * The active template is in use; activate another one before deleting it.
     */
    public function destroy(Request $request, CertificateTemplate $template): RedirectResponse
    {
        $kind = $this->kind($request);
        abort_unless($template->kind === $kind, 404);

        if ($template->is_active) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('The active template cannot be deleted. Activate another one first.')]);

            return back();
        }

        $template->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Template deleted.')]);

        return back();
    }

    /**
     * certificate or marksheet, fixed by the route group (see routes/web.php).
     */
    private function kind(Request $request): string
    {
        return $request->route()->defaults['kind'];
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, string $kind): array
    {
        $hex = ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'];

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'type' => ['required', Rule::in($kind === 'marksheet' ? ['course'] : CertificateTemplate::TYPES)],
            'design' => ['required', Rule::in(CertificateTemplate::DESIGNS)],
            'colors.primary' => $hex,
            'colors.accent' => $hex,
            'colors.background' => $hex,
            'colors.text' => $hex,
            'content.title' => ['required', 'string', 'max:80'],
            'content.subtitle' => ['nullable', 'string', 'max:150'],
            'content.organization' => ['nullable', 'string', 'max:100'],
            'content.signatory' => ['nullable', 'string', 'max:100'],
            'content.footer' => ['nullable', 'string', 'max:150'],
        ], [], ['content.title' => __('title'), 'colors.primary' => __('main colour')]);

        return [
            ...$validated,
            'colors' => array_map('strtolower', $validated['colors']),
            'content' => array_map(fn ($value) => filled($value) ? $value : null, $validated['content']),
        ];
    }
}
