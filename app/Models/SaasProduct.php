<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaasProduct extends Model
{
    protected $fillable = [
        'name',
        'description',
        'category',
        'status',
        'setup_fee',
        'monthly_fee',
        'active_clients',
        'tech_stack',
        'icon_name',
        'image_urls',
    ];

    protected function casts(): array
    {
        return [
            'setup_fee' => 'decimal:2',
            'monthly_fee' => 'decimal:2',
            'tech_stack' => 'array',
            'image_urls' => 'array',
        ];
    }
}
