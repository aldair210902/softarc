<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ResellerPlan */
class ResellerPlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $cost = (float) $this->cost_price;
        $sell = (float) $this->sell_price;
        $includeCost = $request->user() !== null;

        return [
            'id' => (string) $this->id,
            'providerId' => $this->provider_id ? (string) $this->provider_id : null,
            'providerName' => $this->provider?->name ?? '',
            'name' => $this->name,
            'type' => $this->type ?? 'hosting',
            'providerPlanName' => $this->provider_plan_name ?? '',
            'costPrice' => $includeCost ? $cost : null,
            'sellPrice' => $sell,
            'margin' => $includeCost ? round($sell - $cost, 2) : null,
            'billingCycle' => $this->billing_cycle ?? 'Anual',
            'features' => is_array($this->features) ? $this->features : [],
            'description' => $this->description ?? '',
            'isPublic' => (bool) $this->is_public,
            'isActive' => (bool) $this->is_active,
            'isFeatured' => (bool) $this->is_featured,
            'sortOrder' => (int) ($this->sort_order ?? 0),
            'notes' => $includeCost ? ($this->notes ?? '') : '',
        ];
    }
}
