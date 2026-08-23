<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class Credential extends Model
{
    protected $fillable = [
        'name',
        'client_id',
        'domain_id',
        'client_or_server',
        'port',
        'encryption',
        'username',
        'secret',
        'category',
    ];

    protected $hidden = ['secret'];

    protected function casts(): array
    {
        return [
            'port' => 'integer',
        ];
    }

    protected function secret(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? Crypt::decryptString($value) : '',
            set: fn (?string $value) => $value !== null ? Crypt::encryptString($value) : null,
        );
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    public function isFtp(): bool
    {
        $hay = Str::lower(trim(($this->name ?? '').' '.($this->category ?? '').' '.($this->client_or_server ?? '')));

        return str_contains($hay, 'ftp');
    }
}
