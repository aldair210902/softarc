<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Subscription */
class SubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'clientId' => (string) $this->client_id,
            'serviceName' => $this->service_name,
            'amount' => (float) $this->amount,
            'frequency' => $this->frequency,
            'startDate' => $this->start_date?->toDateString(),
            'nextPaymentDate' => $this->next_payment_date?->toDateString(),
            'status' => $this->status,
            'client' => $this->whenLoaded('client', fn () => new ClientResource($this->client)),
        ];
    }
}
