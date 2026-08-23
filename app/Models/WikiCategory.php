<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WikiCategory extends Model
{
    protected $fillable = ['name', 'sort'];

    public function articles(): HasMany
    {
        return $this->hasMany(WikiArticle::class);
    }
}
