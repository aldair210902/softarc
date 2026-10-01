<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        JsonResource::withoutWrapping();

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        $this->configurePublicMediaDisk();
    }

    /**
     * Guarda y sirve medios desde public/storage (en cPanel = public_html/storage),
     * para que al subir una imagen se vea de inmediato sin copiar carpetas.
     */
    private function configurePublicMediaDisk(): void
    {
        $webStorage = public_path('storage');
        $legacyStorage = storage_path('app/public');

        if (! is_dir($webStorage) && ! is_link($webStorage)) {
            if (! is_dir($legacyStorage)) {
                @mkdir($legacyStorage, 0755, true);
            }
            try {
                if (! file_exists($webStorage)) {
                    symlink($legacyStorage, $webStorage);
                }
            } catch (\Throwable) {
                @mkdir($webStorage, 0755, true);
            }
            if (! file_exists($webStorage)) {
                @mkdir($webStorage, 0755, true);
            }
        }

        // Carpeta real en public_html/storage → las subidas son visibles por HTTP.
        // Enlace simbólico → escribir en el destino real.
        $diskRoot = is_link($webStorage)
            ? (readlink($webStorage) ?: $legacyStorage)
            : $webStorage;

        if (! is_dir($diskRoot)) {
            @mkdir($diskRoot, 0755, true);
        }

        if (! is_link($webStorage) && is_dir($legacyStorage)) {
            $realDisk = realpath($diskRoot);
            $realLegacy = realpath($legacyStorage);
            if ($realDisk && $realLegacy && $realDisk !== $realLegacy) {
                $this->mirrorDirectoryIfNeeded($legacyStorage, $diskRoot);
            }
        }

        config([
            'filesystems.disks.public.root' => $diskRoot,
            'filesystems.disks.public.url' => rtrim((string) config('app.url'), '/').'/storage',
            'filesystems.disks.public.visibility' => 'public',
        ]);
    }

    private function mirrorDirectoryIfNeeded(string $from, string $to): void
    {
        if (! is_dir($from)) {
            return;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($from, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $item) {
            /** @var \SplFileInfo $item */
            $relative = substr($item->getPathname(), strlen(rtrim($from, DIRECTORY_SEPARATOR)) + 1);
            if ($relative === false || $relative === '') {
                continue;
            }
            $dest = $to.DIRECTORY_SEPARATOR.$relative;
            if ($item->isDir()) {
                if (! is_dir($dest)) {
                    @mkdir($dest, 0755, true);
                }
                continue;
            }
            if (! is_file($dest)) {
                $parent = dirname($dest);
                if (! is_dir($parent)) {
                    @mkdir($parent, 0755, true);
                }
                @copy($item->getPathname(), $dest);
            }
        }
    }
}
