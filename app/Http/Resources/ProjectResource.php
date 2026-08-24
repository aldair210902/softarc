<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Project */
class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'clientId' => (string) $this->client_id,
            'domainId' => $this->domain_id ? (string) $this->domain_id : '',
            'domainName' => $this->domain?->domain_name ?? '',
            'name' => $this->name,
            'progress' => (int) $this->progress,
            'status' => $this->status,
            'totalAmount' => (float) $this->total_amount,
            'amountPaid' => (float) $this->amount_paid,
            'remainingAmount' => (float) max(0, $this->total_amount - $this->amount_paid),
            'dueDate' => $this->due_date?->toDateString(),
            'repoUrl' => $this->repo_url,
            'localPathPc' => $this->local_path_pc ?? '',
            'localPathLaptop' => $this->local_path_laptop ?? '',
            'lastSyncDevice' => $this->last_sync_device ?? '',
            'lastSyncAt' => $this->last_sync_at?->toISOString(),
            'lastSyncAtHuman' => $this->last_sync_at?->diffForHumans(),
            'syncNote' => $this->sync_note ?? '',
            'dbNote' => $this->db_note ?? '',
            'lastDbTouchAt' => $this->last_db_touch_at?->toDateString(),
            'milestonesTotal' => (int) $this->milestones_total,
            'milestonesDone' => (int) $this->milestones_done,
            'client' => $this->whenLoaded('client', fn () => new ClientResource($this->client)),
        ];
    }
}
