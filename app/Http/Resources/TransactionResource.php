<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Transaction */
class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $client = $this->whenLoaded('client') ? $this->client : null;

        return [
            'id' => (string) $this->id,
            'subscriptionId' => $this->subscription_id ? (string) $this->subscription_id : '',
            'invoiceNumber' => $this->invoice_number ?? '',
            'clientId' => $this->client_id ? (string) $this->client_id : '',
            'clientName' => $client?->business_name ?? '',
            'clientDocument' => $client?->document_number ?? '',
            'concept' => $this->concept,
            'amount' => (float) $this->amount_paid,
            'amountPaid' => (float) $this->amount_paid,
            'paymentMethod' => $this->payment_method,
            'operationCode' => $this->operation_code ?? '',
            'issueDate' => $this->date_received?->toDateString(),
            'dateReceived' => $this->date_received?->toDateString(),
            'status' => $this->status,
        ];
    }
}
