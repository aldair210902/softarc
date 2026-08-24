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
        $customerName = $this->customer_name ?: ($client?->business_name ?? '');
        $customerDocument = $this->customer_document ?: ($client?->document_number ?? '');

        return [
            'id' => (string) $this->id,
            'subscriptionId' => $this->subscription_id ? (string) $this->subscription_id : '',
            'invoiceNumber' => $this->invoice_number ?? '',
            'documentType' => $this->document_type ?? 'Recibo',
            'emissionMode' => $this->emission_mode ?? 'Prueba',
            'clientId' => $this->client_id ? (string) $this->client_id : '',
            'clientName' => $customerName,
            'clientDocument' => $customerDocument,
            'customerName' => $customerName,
            'customerDocument' => $customerDocument,
            'customerAddress' => $this->customer_address ?? '',
            'concept' => $this->concept,
            'amount' => (float) $this->amount_paid,
            'amountPaid' => (float) $this->amount_paid,
            'paymentMethod' => $this->payment_method,
            'operationCode' => $this->operation_code ?? '',
            'issueDate' => $this->date_received?->toDateString(),
            'dateReceived' => $this->date_received?->toDateString(),
            'status' => $this->status,
            'notes' => $this->notes ?? '',
            'isPractice' => ($this->emission_mode ?? 'Prueba') === 'Prueba',
        ];
    }
}
