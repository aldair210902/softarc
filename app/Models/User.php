<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Support\RolePermissions;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'job_title',
        'role',
        'permissions',
        'status',
        'last_login_at',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'permissions' => 'array',
            'last_login_at' => 'datetime',
        ];
    }

    public function isActive(): bool
    {
        return strcasecmp((string) ($this->status ?? 'Activo'), 'Activo') === 0;
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['Super Admin', 'Administrador'], true)
            || in_array('all', $this->permissions ?? [], true);
    }

    /**
     * @return list<string>
     */
    public function effectivePermissions(): array
    {
        return RolePermissions::resolve($this->role, $this->permissions);
    }

    public function canAccess(string $ability): bool
    {
        return RolePermissions::allows($this->effectivePermissions(), $ability);
    }
}
