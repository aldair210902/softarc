<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Server extends Model
{
    protected $fillable = [
        'name', 'ip', 'provider', 'location', 'category', 'ram_usage', 'ram_label',
        'disk_usage', 'disk_label', 'hosted_projects', 'ssl_status', 'node_status', 'panel_url', 'webmail_url',
    ];

    public function domains(): HasMany
    {
        return $this->hasMany(Domain::class);
    }
}
