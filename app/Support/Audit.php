<?php

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class Audit
{
    public static function log(string $action, string $module, array $details = [], string $level = 'info'): void
    {
        $user = Auth::user();
        $maxChars = max(200, (int) config('audit.max_details_chars', 2000));
        $encoded = json_encode($details, JSON_UNESCAPED_UNICODE);
        if (is_string($encoded) && strlen($encoded) > $maxChars) {
            $details = [
                '_truncated' => true,
                'preview' => mb_substr($encoded, 0, $maxChars).'…',
            ];
        }

        AuditLog::query()->create([
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? 'Sistema',
            'ip' => Request::ip(),
            'action' => $action,
            'module' => $module,
            'level' => $level,
            'details' => $details,
        ]);
    }
}
