<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebPage extends Model
{
    protected $fillable = [
        'slug',
        'title',
        'content',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'content' => 'array',
            'is_published' => 'boolean',
        ];
    }
}
