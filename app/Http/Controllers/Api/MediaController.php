<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use App\Models\SaasProduct;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    private const ROOT = 'media';

    public function index()
    {
        $disk = Storage::disk('public');
        if (! $disk->exists(self::ROOT)) {
            $disk->makeDirectory(self::ROOT);
        }

        $usage = $this->usageMap();
        $files = collect($disk->allFiles(self::ROOT))
            ->filter(fn (string $path) => $this->isImage($path))
            ->map(function (string $path) use ($disk, $usage) {
                $url = $this->publicUrl($path);
                $keys = array_unique([
                    $url,
                    $this->normalizeUrlKey($url),
                    $path,
                    'storage/'.$path,
                    '/storage/'.$path,
                ]);
                $usedBy = [];
                foreach ($keys as $key) {
                    foreach ($usage[$key] ?? [] as $ref) {
                        $usedBy[$ref['type'].':'.$ref['id']] = $ref;
                    }
                }

                return [
                    'path' => $path,
                    'url' => $url,
                    'name' => basename($path),
                    'size' => $disk->size($path),
                    'updatedAt' => date('c', $disk->lastModified($path)),
                    'used' => count($usedBy) > 0,
                    'usedBy' => array_values($usedBy),
                ];
            })
            ->sortByDesc('updatedAt')
            ->values();

        return response()->json([
            'items' => $files,
            'stats' => [
                'total' => $files->count(),
                'used' => $files->where('used', true)->count(),
                'unused' => $files->where('used', false)->count(),
            ],
        ]);
    }

    public function upload(Request $request)
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'image', 'max:5120'],
            'folder' => ['nullable', 'string', 'max:40'],
        ]);

        $folder = preg_replace('/[^a-z0-9\-_]/i', '', (string) ($data['folder'] ?? 'catalog')) ?: 'catalog';
        $file = $data['file'];
        $ext = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');
        $name = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'imagen';
        $filename = $name.'-'.Str::lower(Str::random(8)).'.'.$ext;
        $path = self::ROOT.'/'.$folder.'/'.$filename;

        $disk = Storage::disk('public');
        $disk->putFileAs(self::ROOT.'/'.$folder, $file, $filename);

        $url = $this->publicUrl($path);

        Audit::log('Imagen subida', 'Medios', ['path' => $path]);

        return response()->json([
            'path' => $path,
            'url' => $url,
            'name' => $filename,
        ], 201);
    }

    public function destroy(Request $request)
    {
        $data = $request->validate([
            'path' => ['required', 'string', 'max:500'],
            'force' => ['sometimes', 'boolean'],
        ]);

        $path = ltrim(str_replace('\\', '/', $data['path']), '/');
        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, strlen('storage/'));
        }

        if (! str_starts_with($path, self::ROOT.'/')) {
            return response()->json(['message' => 'Ruta no permitida'], 422);
        }

        $disk = Storage::disk('public');
        if (! $disk->exists($path)) {
            return response()->json(['message' => 'Archivo no encontrado'], 404);
        }

        $url = $this->publicUrl($path);
        $usage = $this->usageMap();
        $usedBy = $usage[$url] ?? $usage[$path] ?? [];

        if (count($usedBy) > 0 && empty($data['force'])) {
            return response()->json([
                'message' => 'La imagen está en uso. Usa force=true o desasóciala primero.',
                'usedBy' => array_values($usedBy),
            ], 409);
        }

        if (count($usedBy) > 0) {
            $this->detachFromProducts($url, $path);
        }

        $disk->delete($path);
        Audit::log('Imagen eliminada', 'Medios', ['path' => $path], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }

    /**
     * @return array<string, list<array{id: string, name: string, type: string}>>
     */
    private function usageMap(): array
    {
        $map = [];

        foreach (SaasProduct::query()->get(['id', 'name', 'image_urls']) as $product) {
            foreach (($product->image_urls ?? []) as $raw) {
                $key = $this->normalizeUrlKey((string) $raw);
                if ($key === '') {
                    continue;
                }
                $ref = [
                    'id' => (string) $product->id,
                    'name' => $product->name,
                    'type' => 'catalog',
                ];
                $map[$key][] = $ref;
                $map[(string) $raw][] = $ref;
                if (preg_match('#media/.+$#', $key, $m)) {
                    $map[$m[0]][] = $ref;
                    $map['storage/'.$m[0]][] = $ref;
                }
            }
        }

        $settings = CompanySetting::query()->first();
        $data = is_array($settings?->data) ? $settings->data : [];
        $brandLabels = [
            'logoUrl' => 'Marca · logo legado',
            'logotipoUrl' => 'Marca · Logotipo (legado)',
            'logotipoLightUrl' => 'Marca · Logotipo claro',
            'logotipoDarkUrl' => 'Marca · Logotipo oscuro',
            'isotipoUrl' => 'Marca · Isotipo (legado)',
            'isotipoLightUrl' => 'Marca · Isotipo claro · Favicon / Admin',
            'isotipoDarkUrl' => 'Marca · Isotipo oscuro · Favicon / Admin',
            'imagotipoUrl' => 'Marca · Imagotipo (legado)',
            'imagotipoLightUrl' => 'Marca · Imagotipo claro · Cabecera web',
            'imagotipoDarkUrl' => 'Marca · Imagotipo oscuro · Cabecera web',
            'isologoUrl' => 'Marca · Isologo (legado)',
            'isologoLightUrl' => 'Marca · Isologo claro · Footer / Login',
            'isologoDarkUrl' => 'Marca · Isologo oscuro · Footer / Login',
        ];
        foreach (array_keys($brandLabels) as $field) {
            $logo = $data[$field] ?? null;
            if (! is_string($logo) || trim($logo) === '') {
                continue;
            }
            $key = $this->normalizeUrlKey($logo);
            if ($key === '') {
                continue;
            }
            $ref = [
                'id' => 'brand:'.$field,
                'name' => $brandLabels[$field],
                'type' => 'branding',
            ];
            $map[$key][] = $ref;
            $map[$logo][] = $ref;
            if (preg_match('#media/.+$#', $key, $m)) {
                $map[$m[0]][] = $ref;
                $map['storage/'.$m[0]][] = $ref;
                $map['/storage/'.$m[0]][] = $ref;
            }
        }

        return $map;
    }

    private function detachFromProducts(string $url, string $path): void
    {
        foreach (SaasProduct::query()->get() as $product) {
            $urls = $product->image_urls ?? [];
            if (! is_array($urls) || $urls === []) {
                continue;
            }

            $filtered = array_values(array_filter($urls, function ($item) use ($path, $url) {
                $n = $this->normalizeUrlKey((string) $item);

                return ! str_contains($n, $path) && $n !== $this->normalizeUrlKey($url);
            }));

            if (count($filtered) !== count($urls)) {
                $product->update(['image_urls' => $filtered]);
            }
        }

        $settings = CompanySetting::query()->first();
        if ($settings && is_array($settings->data)) {
            $data = $settings->data;
            $changed = false;
            foreach ([
                'logoUrl',
                'logotipoUrl', 'logotipoLightUrl', 'logotipoDarkUrl',
                'isotipoUrl', 'isotipoLightUrl', 'isotipoDarkUrl',
                'imagotipoUrl', 'imagotipoLightUrl', 'imagotipoDarkUrl',
                'isologoUrl', 'isologoLightUrl', 'isologoDarkUrl',
            ] as $field) {
                $logo = (string) ($data[$field] ?? '');
                if ($logo !== '' && (str_contains($this->normalizeUrlKey($logo), $path) || $this->normalizeUrlKey($logo) === $this->normalizeUrlKey($url))) {
                    $data[$field] = '';
                    $changed = true;
                }
            }
            if ($changed) {
                $settings->update(['data' => $data]);
            }
        }
    }

    private function publicUrl(string $path): string
    {
        return asset('storage/'.$path);
    }

    private function normalizeUrlKey(string $value): string
    {
        $value = trim($value);
        if ($value === '') {
            return '';
        }

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            $parts = parse_url($value);
            $value = (string) ($parts['path'] ?? '');
        }

        // Ignorar ?v=… / #fragment al comparar uso (p. ej. cache bust de logos)
        $value = explode('?', $value, 2)[0];
        $value = explode('#', $value, 2)[0];

        return '/'.ltrim($value, '/');
    }

    private function isImage(string $path): bool
    {
        return (bool) preg_match('/\.(jpe?g|png|gif|webp|svg)$/i', $path);
    }
}
