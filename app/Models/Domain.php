<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Domain extends Model
{
    protected $fillable = [
        'domain_name',
        'client_id',
        'client_name',
        'server_id',
        'provider',
        'expiry_date',
        'auto_renew',
        'dns_zone',
        'nameserver1',
        'nameserver1_ip',
        'nameserver2',
        'nameserver2_ip',
    ];

    protected function casts(): array
    {
        return [
            'expiry_date' => 'date',
            'auto_renew' => 'boolean',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    public function credentials(): HasMany
    {
        return $this->hasMany(Credential::class);
    }
}
