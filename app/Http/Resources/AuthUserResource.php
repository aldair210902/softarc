<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class AuthUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'jobTitle' => $this->job_title,
            'role' => $this->role ?? 'Colaborador',
            'permissions' => $this->effectivePermissions(),
            'status' => $this->status ?? 'Activo',
        ];
    }
}
