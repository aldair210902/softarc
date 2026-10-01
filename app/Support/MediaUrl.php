<?php

namespace App\Support;

/** Normaliza URLs de archivos en /storage (evita localhost u otros hosts viejos). */
class MediaUrl
{
    public static function toPublic(?string $url): string
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

        if (str_starts_with($url, '/')) {
            return $url;
        }

        return $url;
    }

    /**
     * @param  list<string>|null  $urls
     * @return list<string>
     */
    public static function mapList(?array $urls): array
    {
        if (! is_array($urls)) {
            return [];
        }

        $out = [];
        foreach ($urls as $url) {
            $n = self::toPublic(is_string($url) ? $url : '');
            if ($n !== '') {
                $out[] = $n;
            }
        }

        return array_values(array_unique($out));
    }

    /** @var list<string> */
    public const BRAND_URL_KEYS = [
        'logoUrl',
        'isotipoUrl', 'isotipoLightUrl', 'isotipoDarkUrl',
        'logotipoUrl', 'logotipoLightUrl', 'logotipoDarkUrl',
        'imagotipoUrl', 'imagotipoLightUrl', 'imagotipoDarkUrl',
        'isologoUrl', 'isologoLightUrl', 'isologoDarkUrl',
    ];

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public static function mapSettings(array $data): array
    {
        foreach (self::BRAND_URL_KEYS as $key) {
            if (! isset($data[$key]) || ! is_string($data[$key])) {
                continue;
            }
            $data[$key] = self::toPublic($data[$key]);
        }

        return $data;
    }
}
