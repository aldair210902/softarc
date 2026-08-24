<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientService extends Model
{
    protected $fillable = [
        'client_id',
        'reseller_plan_id',
        'service_label',
        'type',
        'domain_name',
        'cost_price',
        'sell_price',
        'billing_cycle',
        'status',
        'start_date',
        'renew_date',
        'domain_id',
        'server_id',
        'subscription_id',
        'provider_name',
        'delivery_notes',
        'internal_notes',
    ];

    protected $casts = [
        'cost_price' => 'float',
        'sell_price' => 'float',
        'start_date' => 'date',
        'renew_date' => 'date',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(ResellerPlan::class, 'reseller_plan_id');
    }

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}
