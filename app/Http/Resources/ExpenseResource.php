<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Expense */
class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'provider' => $this->provider,
            'concept' => $this->concept,
            'category' => $this->category,
            'frequency' => $this->frequency,
            'amount' => (float) $this->amount,
            'date' => $this->date?->toDateString(),
            'status' => $this->status,
        ];
    }
}
