<?php
/**
 * Sin terminal: limpia cachés de Laravel borrando archivos.
 * 1) Sube a public_html/clear-caches.php
 * 2) Abre https://tudominio.com/clear-caches.php
 * 3) Borra este archivo del servidor
 */

declare(strict_types=1);

header('Content-Type: text/plain; charset=utf-8');

$appRoot = __DIR__.'/../softarc';
$targets = [
    $appRoot.'/bootstrap/cache/config.php',
    $appRoot.'/bootstrap/cache/routes-v7.php',
    $appRoot.'/bootstrap/cache/events.php',
    $appRoot.'/bootstrap/cache/packages.php',
    $appRoot.'/bootstrap/cache/services.php',
];

$cleared = 0;
foreach ($targets as $file) {
    if (is_file($file) && @unlink($file)) {
        echo "Borrado: {$file}\n";
        $cleared++;
    }
}

$framework = $appRoot.'/storage/framework';
foreach (['cache/data', 'views'] as $rel) {
    $dir = $framework.'/'.$rel;
    if (! is_dir($dir)) {
        continue;
    }
    $n = clearDirContents($dir);
    if ($n > 0) {
        echo "Limpiados {$n} archivos en {$rel}\n";
        $cleared += $n;
    }
}

echo $cleared > 0
    ? "\nOK: caché limpiada ({$cleared}). Borra clear-caches.php ahora.\n"
    : "\nNada que limpiar (o ya estaba vacío). Borra clear-caches.php.\n";

function clearDirContents(string $dir): int
{
    $count = 0;
    $items = @scandir($dir);
    if (! is_array($items)) {
        return 0;
    }
    foreach ($items as $item) {
        if ($item === '.' || $item === '..' || $item === '.gitignore') {
            continue;
        }
        $path = $dir.DIRECTORY_SEPARATOR.$item;
        if (is_dir($path)) {
            $count += clearDirContents($path);
            @rmdir($path);
            continue;
        }
        if (@unlink($path)) {
            $count++;
        }
    }

    return $count;
}
