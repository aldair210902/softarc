<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Server */
class ServerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'ip' => $this->ip ?? '',
            'provider' => $this->provider ?? '',
            'location' => $this->location ?? '',
            'category' => $this->category ?? '',
            'ramUsage' => (int) $this->ram_usage,
            'ramLabel' => $this->ram_label ?? '',
            'diskUsage' => (int) $this->disk_usage,
            'diskLabel' => $this->disk_label ?? '',
            'hostedProjects' => $this->hosted_projects ?? '',
            'sslStatus' => $this->ssl_status,
            'nodeStatus' => $this->node_status,
            'panelUrl' => $this->panel_url,
            'webmailUrl' => $this->webmail_url,
        ];
    }
}
