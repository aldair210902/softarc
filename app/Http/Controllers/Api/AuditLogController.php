<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use App\Support\Audit;
use App\Support\AuditRetention;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'level' => ['nullable', 'string', 'in:info,warning,critical'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        $perPage = $validated['per_page'] ?? 50;
        $q = trim((string) ($validated['q'] ?? ''));
        $level = $validated['level'] ?? null;

        $query = AuditLog::query()->latest('id');

        if ($level) {
            $query->where('level', $level);
        }

        if ($q !== '') {
            $like = '%'.$q.'%';
            $query->where(function ($builder) use ($like) {
                $builder->where('user_name', 'like', $like)
                    ->orWhere('ip', 'like', $like)
                    ->orWhere('action', 'like', $like)
                    ->orWhere('module', 'like', $like);
            });
        }

        $paginator = $query->paginate($perPage)->withQueryString();
        $retention = AuditRetention::settings();
        $monthStart = now()->startOfMonth();

        // Una sola query de agregados en lugar de 4 COUNT separados.
        $agg = AuditLog::query()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as month_count', [$monthStart])
            ->selectRaw("SUM(CASE WHEN level = 'critical' THEN 1 ELSE 0 END) as critical_count")
            ->selectRaw("SUM(CASE WHEN level = 'warning' THEN 1 ELSE 0 END) as warning_count")
            ->first();

        return AuditLogResource::collection($paginator)->additional([
            'stats' => [
                'total' => (int) ($agg->total ?? 0),
                'month' => (int) ($agg->month_count ?? 0),
                'critical' => (int) ($agg->critical_count ?? 0),
                'warning' => (int) ($agg->warning_count ?? 0),
                'retentionDays' => $retention['retentionDays'],
                'maxRows' => $retention['maxRows'],
                'keepCritical' => $retention['keepCritical'],
            ],
        ]);
    }

    public function updateSettings(Request $request)
    {
        $data = $request->validate([
            'retentionDays' => ['required', 'integer', 'min:7', 'max:3650'],
            'keepCritical' => ['required', 'boolean'],
            'maxRows' => ['required', 'integer', 'min:1000', 'max:1000000'],
        ]);

        $settings = AuditRetention::update($data);
        Audit::log('Política de auditoría actualizada', 'Sistema', $settings, 'warning');

        return response()->json(['stats' => array_merge(
            [
                'total' => AuditLog::query()->count(),
                'month' => AuditLog::query()->where('created_at', '>=', now()->startOfMonth())->count(),
                'critical' => AuditLog::query()->where('level', 'critical')->count(),
                'warning' => AuditLog::query()->where('level', 'warning')->count(),
            ],
            $settings,
        )]);
    }

    public function prune(Request $request)
    {
        $mode = $request->validate([
            'mode' => ['nullable', 'string', 'in:policy,all'],
        ])['mode'] ?? 'policy';

        if ($mode === 'all') {
            $deleted = AuditRetention::purgeAll();
            // No registrar en auditoría: dejaría otra fila tras “vaciar”.
            $retention = AuditRetention::settings();

            return response()->json([
                'result' => [
                    'deletedByAge' => $deleted,
                    'deletedByCap' => 0,
                    'remaining' => 0,
                    'mode' => 'all',
                ],
                'stats' => [
                    'total' => 0,
                    'month' => 0,
                    'critical' => 0,
                    'warning' => 0,
                    'retentionDays' => $retention['retentionDays'],
                    'maxRows' => $retention['maxRows'],
                    'keepCritical' => $retention['keepCritical'],
                ],
            ]);
        }

        $result = AuditRetention::prune();
        // Registrar fuera del set que se acaba de limpiar puede confundir; opcional y corto.
        Audit::log('Limpieza por política de retención', 'Sistema', $result, 'info');

        $retention = AuditRetention::settings();

        return response()->json([
            'result' => array_merge($result, ['mode' => 'policy']),
            'stats' => [
                'total' => AuditLog::query()->count(),
                'month' => AuditLog::query()->where('created_at', '>=', now()->startOfMonth())->count(),
                'critical' => AuditLog::query()->where('level', 'critical')->count(),
                'warning' => AuditLog::query()->where('level', 'warning')->count(),
                'retentionDays' => $retention['retentionDays'],
                'maxRows' => $retention['maxRows'],
                'keepCritical' => $retention['keepCritical'],
            ],
        ]);
    }
}
