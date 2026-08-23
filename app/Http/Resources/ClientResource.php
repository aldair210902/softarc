<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Client */
class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'businessName' => $this->business_name,
            'documentNumber' => $this->document_number,
            'contactName' => $this->contact_name,
            'phone' => $this->phone ?? '',
            'billingEmail' => $this->billing_email ?? '',
            'status' => $this->status,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
