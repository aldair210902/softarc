<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Project extends Model
{
    protected $fillable = [
        'client_id', 'name', 'progress', 'status', 'total_amount', 'amount_paid',
        'due_date', 'repo_url', 'local_path_pc', 'local_path_laptop',
        'last_sync_device', 'last_sync_at', 'sync_note', 'db_note', 'last_db_touch_at',
        'milestones_total', 'milestones_done',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'due_date' => 'date',
            'last_sync_at' => 'datetime',
            'last_db_touch_at' => 'date',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
