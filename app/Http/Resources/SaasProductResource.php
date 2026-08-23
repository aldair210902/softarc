<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\SaasProduct */
class SaasProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'description' => $this->description ?? '',
            'category' => $this->category,
            'status' => $this->status,
            'setupFee' => (float) $this->setup_fee,
            'monthlyFee' => (float) $this->monthly_fee,
            'activeClients' => (int) $this->active_clients,
            'techStack' => $this->tech_stack ?? [],
            'iconName' => $this->icon_name ?? 'Box',
            'imageUrls' => $this->image_urls ?? [],
        ];
    }
}
