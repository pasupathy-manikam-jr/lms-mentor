<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\MediaFolder;
use App\Support\ContentOwner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Media Library, following the Mentor demo: upload files, sort them into folders, filter by type,
 * copy a file's link, and delete selected files.
 */
class MediaController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'kind' => ['nullable', Rule::in(Media::KINDS)],
            'folder' => ['nullable', 'integer', Rule::exists('media_folders', 'id')],
            'per_page' => ['nullable', 'integer', 'in:20,40,80'],
        ]);

        $inScope = Media::query()
            // Instructors see only what they uploaded.
            ->when(ContentOwner::isInstructor(), fn ($query) => $query->where('user_id', $request->user()->id))
            ->when($filters['folder'] ?? null, fn ($query, $folder) => $query->where('media_folder_id', $folder))
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->whereLike('name', "%{$search}%"));

        return Inertia::render('admin/media/index', [
            'media' => (clone $inScope)
                ->when($filters['kind'] ?? null, fn ($query, $kind) => $query->where('kind', $kind))
                ->latest('id')
                ->paginate($filters['per_page'] ?? 20)
                ->withQueryString(),
            // Tab counts for the current folder and search.
            'counts' => [
                'all' => (clone $inScope)->count(),
                ...(clone $inScope)->toBase()->selectRaw('kind, count(*) as total')->groupBy('kind')->pluck('total', 'kind')->map(fn ($total) => (int) $total),
            ],
            'canManageFolders' => ! ContentOwner::isInstructor(),
            'folders' => MediaFolder::withCount('media')->orderBy('name')->get(['id', 'name']),
            'filters' => $filters,
            'accept' => '.'.implode(',.', array_merge(...array_values(Media::EXTENSIONS))),
        ]);
    }

    /**
     * Upload up to 20 files at once, 45 MB each (MAMP's PHP allows 48 MB per request).
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'files' => ['required', 'array', 'max:20'],
            'files.*' => ['file', 'max:46080', 'extensions:'.implode(',', array_merge(...array_values(Media::EXTENSIONS)))],
            'folder_id' => ['nullable', 'integer', Rule::exists('media_folders', 'id')],
        ]);

        foreach ($validated['files'] as $file) {
            Media::create([
                'user_id' => $request->user()->id,
                'media_folder_id' => $validated['folder_id'] ?? null,
                'name' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'path' => $file->store('media', 'public'),
                'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                'kind' => Media::kindOf($file->getClientOriginalExtension()) ?? 'document',
                'size' => $file->getSize(),
            ]);
        }

        return $this->done(__(':count files uploaded.', ['count' => count($validated['files'])]));
    }

    public function update(Request $request, Media $media): RedirectResponse
    {
        abort_if(ContentOwner::isInstructor() && $media->user_id !== $request->user()->id, 404);

        $media->update($request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'media_folder_id' => ['sometimes', 'nullable', 'integer', Rule::exists('media_folders', 'id')],
        ]));

        return $this->done(__('Saved.'));
    }

    /**
     * Delete the selected files. Pages that link to them will show a broken image or link.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $ids = $request->validate(['ids' => ['required', 'array', 'max:100'], 'ids.*' => ['integer']])['ids'];

        Media::whereKey($ids)
            ->when(ContentOwner::isInstructor(), fn ($query) => $query->where('user_id', $request->user()->id))
            ->get()->each->delete();

        return $this->done(__('Deleted.'));
    }

    public function storeFolder(Request $request): RedirectResponse
    {
        MediaFolder::create($request->validate(['name' => ['required', 'string', 'max:100', Rule::unique('media_folders', 'name')]]));

        return $this->done(__('Folder created.'));
    }

    public function destroyFolder(MediaFolder $folder): RedirectResponse
    {
        $folder->delete();

        return $this->done(__('Folder deleted. Its files are still in All items.'));
    }

    private function done(string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }
}
