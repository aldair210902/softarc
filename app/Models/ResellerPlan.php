<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ResellerPlan extends Model
{
    protected $fillable = [
        'provider_id',
        'name',
        'type',
        'provider_plan_name',
        'cost_price',
        'sell_price',
        'billing_cycle',
        'features',
        'description',
        'is_public',
        'is_active',
        'is_featured',
        'sort_order',
        'notes',
    ];

    protected $casts = [
        'cost_price' => 'float',
        'sell_price' => 'float',
        'features' => 'array',
        'is_public' => 'boolean',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function clientServices(): HasMany
    {
        return $this->hasMany(ClientService::class);
    }
}
