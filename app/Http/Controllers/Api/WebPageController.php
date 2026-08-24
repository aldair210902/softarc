<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WebPage;
use App\Support\Audit;
use Illuminate\Http\Request;

class WebPageController extends Controller
{
    /** Listado admin de todas las páginas. */
    public function index()
    {
        return WebPage::query()
            ->orderBy('slug')
            ->get()
            ->map(fn (WebPage $page) => $this->toPayload($page));
    }

    /** Admin: obtener una página por slug (incluye no publicadas). */
    public function show(string $slug)
    {
        $page = WebPage::query()->where('slug', $slug)->firstOrFail();

        return $this->toPayload($page);
    }

    /** Público: solo páginas publicadas. */
    public function publicShow(string $slug)
    {
        $page = WebPage::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        return $this->toPayload($page);
    }

    /** Admin: upsert de contenido por slug. */
    public function update(Request $request, string $slug)
    {
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'array'],
            'isPublished' => ['sometimes', 'boolean'],
        ]);

        $page = WebPage::query()->firstOrNew(['slug' => $slug]);
        $page->title = $data['title'] ?? $page->title ?? $slug;
        $page->content = $data['content'];
        if (array_key_exists('isPublished', $data)) {
            $page->is_published = (bool) $data['isPublished'];
        } elseif (! $page->exists) {
            $page->is_published = true;
        }
        $page->save();

        Audit::log('Página web actualizada', 'Contenido web', [
            'slug' => $page->slug,
            'id' => $page->id,
        ]);

        return $this->toPayload($page->fresh());
    }

    private function toPayload(WebPage $page): array
    {
        return [
            'id' => $page->id,
            'slug' => $page->slug,
            'title' => $page->title,
            'content' => $page->content ?? [],
            'isPublished' => (bool) $page->is_published,
            'updatedAt' => optional($page->updated_at)?->toIso8601String(),
        ];
    }
}
