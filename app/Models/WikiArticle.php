<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WikiArticle extends Model
{
    protected $fillable = [
        'wiki_category_id', 'title', 'author', 'tags', 'content',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(WikiCategory::class, 'wiki_category_id');
    }
}
