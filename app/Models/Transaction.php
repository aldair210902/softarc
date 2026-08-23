<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    protected $fillable = [
        'subscription_id',
        'client_id',
        'invoice_number',
        'concept',
        'amount_paid',
        'payment_method',
        'operation_code',
        'date_received',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'amount_paid' => 'decimal:2',
            'date_received' => 'date',
        ];
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
