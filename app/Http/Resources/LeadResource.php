<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Lead */
class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'contactName' => $this->contact_name,
            'companyName' => $this->company_name,
            'phone' => $this->phone ?? '',
            'email' => $this->email ?? '',
            'serviceOfInterest' => $this->service_of_interest ?? '',
            'status' => $this->status,
            'notes' => $this->notes ?? '',
            'meta' => is_array($this->meta) ? $this->meta : [],
            'convertedClientId' => $this->converted_client_id ? (string) $this->converted_client_id : '',
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
