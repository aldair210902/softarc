<?php
/**
 * Una sola vez: convierte image_urls / marca con localhost a rutas /storage/...
 * 1) Sube a public_html/fix-media-urls.php
 * 2) Abre https://softarchitec.com/fix-media-urls.php
 * 3) Borra el archivo del servidor
 */

declare(strict_types=1);

header('Content-Type: text/plain; charset=utf-8');

$appRoot = __DIR__.'/../softarc';
if (! is_file($appRoot.'/vendor/autoload.php')) {
    http_response_code(500);
    echo "No se encuentra softarc en {$appRoot}\n";
    exit;
}

require $appRoot.'/vendor/autoload.php';
/** @var \Illuminate\Foundation\Application $app */
$app = require $appRoot.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

function toPublicStorageUrl(?string $url): string
{
    $url = trim((string) $url);
    if ($url === '') {
        return '';
    }
    if (preg_match('#/storage/(.+?)(?:\?.*)?$#i', $url, $m)) {
        return '/storage/'.ltrim($m[1], '/');
    }
    if (str_starts_with($url, 'media/')) {
        return '/storage/'.$url;
    }

    return $url;
}

$updated = 0;
$products = \App\Models\SaasProduct::query()->get(['id', 'name', 'image_urls']);

foreach ($products as $product) {
    $urls = $product->image_urls ?? [];
    if (! is_array($urls) || $urls === []) {
        continue;
    }
    $mapped = [];
    $changed = false;
    foreach ($urls as $raw) {
        $next = toPublicStorageUrl(is_string($raw) ? $raw : '');
        if ($next === '') {
            continue;
        }
        if ($next !== $raw) {
            $changed = true;
        }
        $mapped[] = $next;
    }
    $mapped = array_values(array_unique($mapped));
    if (! $changed) {
        continue;
    }
    $product->image_urls = $mapped;
    $product->save();
    $updated++;
    echo "OK producto #{$product->id} {$product->name}\n";
    foreach ($mapped as $u) {
        echo "  → {$u}\n";
    }
}

$settings = \App\Models\CompanySetting::query()->first();
if ($settings) {
    $data = is_array($settings->data) ? $settings->data : [];
    $brandKeys = [
        'logoUrl',
        'isotipoUrl', 'isotipoLightUrl', 'isotipoDarkUrl',
        'logotipoUrl', 'logotipoLightUrl', 'logotipoDarkUrl',
        'imagotipoUrl', 'imagotipoLightUrl', 'imagotipoDarkUrl',
        'isologoUrl', 'isologoLightUrl', 'isologoDarkUrl',
    ];
    $dirty = false;
    foreach ($brandKeys as $key) {
        if (! isset($data[$key]) || ! is_string($data[$key])) {
            continue;
        }
        $next = toPublicStorageUrl($data[$key]);
        if ($next !== '' && $next !== $data[$key]) {
            $data[$key] = $next;
            $dirty = true;
            echo "OK settings.{$key} → {$next}\n";
        }
    }
    if ($dirty) {
        $settings->data = $data;
        $settings->save();
        $updated++;
    }
}

echo "\nListo. Registros tocados: {$updated}\n";
echo "IMPORTANTE: borra public_html/fix-media-urls.php ahora.\n";
