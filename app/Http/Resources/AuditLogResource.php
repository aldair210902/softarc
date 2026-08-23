<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\AuditLog */
class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'timestamp' => $this->created_at?->format('Y-m-d H:i:s'),
            'user' => $this->user_name ?? 'Sistema',
            'ip' => $this->ip ?? '',
            'action' => $this->action,
            'module' => $this->module,
            'level' => $this->level,
            'details' => json_encode($this->details ?? [], JSON_UNESCAPED_UNICODE),
        ];
    }
}
