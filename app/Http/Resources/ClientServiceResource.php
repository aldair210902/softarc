<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ClientService */
class ClientServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $cost = (float) $this->cost_price;
        $sell = (float) $this->sell_price;

        return [
            'id' => (string) $this->id,
            'clientId' => (string) $this->client_id,
            'clientName' => $this->client?->name ?? '',
            'resellerPlanId' => $this->reseller_plan_id ? (string) $this->reseller_plan_id : null,
            'planName' => $this->plan?->name ?? '',
            'serviceLabel' => $this->service_label,
            'type' => $this->type ?? 'hosting',
            'domainName' => $this->domain_name ?? '',
            'costPrice' => $cost,
            'sellPrice' => $sell,
            'margin' => round($sell - $cost, 2),
            'billingCycle' => $this->billing_cycle ?? 'Anual',
            'status' => $this->status ?? 'Pendiente',
            'startDate' => optional($this->start_date)?->format('Y-m-d'),
            'renewDate' => optional($this->renew_date)?->format('Y-m-d'),
            'domainId' => $this->domain_id ? (string) $this->domain_id : null,
            'serverId' => $this->server_id ? (string) $this->server_id : null,
            'subscriptionId' => $this->subscription_id ? (string) $this->subscription_id : null,
            'providerName' => $this->provider_name ?? '',
            'deliveryNotes' => $this->delivery_notes ?? '',
            'internalNotes' => $this->internal_notes ?? '',
        ];
    }
}
