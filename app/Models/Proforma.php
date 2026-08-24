<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Proforma extends Model
{
    protected $fillable = [
        'number',
        'client_id',
        'customer_name',
        'customer_document',
        'customer_address',
        'concept',
        'amount',
        'currency_symbol',
        'issue_date',
        'valid_until',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'issue_date' => 'date',
            'valid_until' => 'date',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
