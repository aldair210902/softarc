<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\SupportTicket */
class SupportTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'clientId' => $this->client_id ? (string) $this->client_id : '',
            'subject' => $this->subject,
            'client' => $this->client_name ?? $this->client?->business_name ?? '',
            'system' => $this->system ?? '',
            'priority' => $this->priority,
            'status' => $this->status,
            'assigneeId' => $this->assignee_id ? (string) $this->assignee_id : '',
            'assigneeName' => $this->assignee?->name ?? '',
            'lastActivity' => $this->last_activity_at?->diffForHumans() ?? $this->updated_at?->diffForHumans(),
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
