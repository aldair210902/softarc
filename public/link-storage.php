<?php
/**
 * Una sola vez: crea el enlace public_html/storage → softarc/storage/app/public
 * Úsalo si las imágenes subidas no se ven y no quieres copiar carpetas.
 *
 * Cómo:
 * 1) En File Manager borra la carpeta public_html/storage (si es copia normal, no enlace).
 * 2) Abre en el navegador: https://tudominio.com/link-storage.php
 * 3) Si OK, borra este archivo del servidor.
 */

$target = __DIR__.'/../softarc/storage/app/public';
$link = __DIR__.'/storage';

header('Content-Type: text/plain; charset=utf-8');

if (! is_dir($target)) {
    if (! @mkdir($target, 0755, true) && ! is_dir($target)) {
        http_response_code(500);
        echo "No existe ni se pudo crear: {$target}\n";
        exit;
    }
}

if (is_link($link)) {
    echo "OK: el enlace ya existe.\n";
    echo "{$link} → ".readlink($link)."\n";
    exit;
}

if (file_exists($link)) {
    http_response_code(409);
    echo "EXISTE una carpeta/archivo en public_html/storage.\n";
    echo "Bórrala o renómbrala en File Manager y vuelve a abrir esta URL.\n";
    exit;
}

if (@symlink($target, $link)) {
    echo "OK: enlace creado.\n";
    echo "{$link} → {$target}\n";
    echo "Ahora sube una imagen en el admin y debería verse sin copiar carpetas.\n";
    echo "IMPORTANTE: borra este archivo link-storage.php del servidor.\n";
    exit;
}

http_response_code(500);
echo "No se pudo crear el symlink (el hosting puede bloquearlo).\n";
echo "En cPanel File Manager busca 'Create Symlink' o contacta soporte.\n";
echo "Destino: {$target}\n";
echo "Enlace: {$link}\n";
