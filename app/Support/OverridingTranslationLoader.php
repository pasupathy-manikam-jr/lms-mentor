<?php

namespace App\Support;

use App\Models\Language;
use Illuminate\Contracts\Translation\Loader;

/**
 * Laravel's translation loader, with the wording an admin changed in Translation laid over the
 * lang/{locale}.json lines, so __() uses it too.
 */
class OverridingTranslationLoader implements Loader
{
    public function __construct(private Loader $files) {}

    /**
     * @return array<string, mixed>
     */
    public function load($locale, $group, $namespace = null)
    {
        $lines = $this->files->load($locale, $group, $namespace);

        if ($group !== '*' || $namespace !== '*') {
            return $lines;
        }

        try {
            return [...$lines, ...Language::overrides($locale)];
        } catch (\Throwable) {
            // Before migrations have run (e.g. during install) there are no overrides yet.
            return $lines;
        }
    }

    public function addNamespace($namespace, $hint)
    {
        $this->files->addNamespace($namespace, $hint);
    }

    public function addJsonPath($path)
    {
        $this->files->addJsonPath($path);
    }

    /**
     * @return array<string, string>
     */
    public function namespaces()
    {
        return $this->files->namespaces();
    }
}
