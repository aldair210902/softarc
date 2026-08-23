<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Provider */
class ProviderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'type' => $this->type ?? 'both',
            'websiteUrl' => $this->website_url ?? '',
            'panelUrl' => $this->panel_url ?? '',
            'notes' => $this->notes ?? '',
            'isActive' => (bool) $this->is_active,
        ];
    }
}
