<?php

namespace App\Support;

use App\Models\AuditLog;
use App\Models\CompanySetting;

class AuditRetention
{
    /**
     * @return array{retentionDays: int, keepCritical: bool, maxRows: int}
     */
    public static function settings(): array
    {
        $data = CompanySetting::query()->first()?->data ?? [];

        return [
            'retentionDays' => max(7, (int) ($data['auditRetentionDays'] ?? config('audit.retention_days', 90))),
            'keepCritical' => filter_var(
                $data['auditKeepCritical'] ?? config('audit.keep_critical', true),
                FILTER_VALIDATE_BOOL
            ),
            'maxRows' => max(1000, (int) ($data['auditMaxRows'] ?? config('audit.max_rows', 50000))),
        ];
    }

    /**
     * @param  array{retentionDays?: int, keepCritical?: bool, maxRows?: int}  $input
     * @return array{retentionDays: int, keepCritical: bool, maxRows: int}
     */
    public static function update(array $input): array
    {
        $current = self::settings();
        $next = [
            'auditRetentionDays' => isset($input['retentionDays'])
                ? max(7, min(3650, (int) $input['retentionDays']))
                : $current['retentionDays'],
            'auditKeepCritical' => array_key_exists('keepCritical', $input)
                ? (bool) $input['keepCritical']
                : $current['keepCritical'],
            'auditMaxRows' => isset($input['maxRows'])
                ? max(1000, min(1000000, (int) $input['maxRows']))
                : $current['maxRows'],
        ];

        $settings = CompanySetting::query()->first();
        if (! $settings) {
            CompanySetting::query()->create(['data' => $next]);
        } else {
            $settings->update(['data' => array_merge($settings->data ?? [], $next)]);
        }

        return self::settings();
    }

    /**
     * @return array{deletedByAge: int, deletedByCap: int, remaining: int}
     */
    public static function prune(): array
    {
        $cfg = self::settings();
        $days = $cfg['retentionDays'];
        $keepCritical = $cfg['keepCritical'];
        $maxRows = $cfg['maxRows'];

        $cutoff = now()->subDays($days);
        $byAge = AuditLog::query()->where('created_at', '<', $cutoff);
        if ($keepCritical) {
            $byAge->where(function ($q) {
                $q->whereNull('level')->orWhere('level', '!=', 'critical');
            });
        }

        $deletedByAge = 0;
        $byAge->orderBy('id')->chunkById(500, function ($rows) use (&$deletedByAge) {
            $ids = $rows->pluck('id');
            $deletedByAge += AuditLog::query()->whereIn('id', $ids)->delete();
        });

        $deletedByCap = 0;
        $total = AuditLog::query()->count();
        $overflow = max(0, $total - $maxRows);
        if ($overflow > 0) {
            $overflowQuery = AuditLog::query()->orderBy('id');
            if ($keepCritical) {
                $overflowQuery->where(function ($q) {
                    $q->whereNull('level')->orWhere('level', '!=', 'critical');
                });
            }
            $ids = $overflowQuery->limit($overflow)->pluck('id');
            $deletedByCap = AuditLog::query()->whereIn('id', $ids)->delete();
        }

        return [
            'deletedByAge' => $deletedByAge,
            'deletedByCap' => $deletedByCap,
            'remaining' => AuditLog::query()->count(),
        ];
    }

    /** Borra todos los registros de auditoría. */
    public static function purgeAll(): int
    {
        $total = AuditLog::query()->count();
        AuditLog::query()->delete();

        return $total;
    }
}
