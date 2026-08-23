<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeamMemberResource;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return new TeamMemberResource($request->user());
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'jobTitle' => ['nullable', 'string', 'max:100'],
            'password' => ['nullable', 'string', Password::min(8)],
            'currentPassword' => ['required_with:password', 'string'],
        ]);

        if (! empty($data['password'])) {
            if (! Hash::check($data['currentPassword'], $user->password)) {
                return response()->json(['message' => 'La contraseña actual no es correcta'], 422);
            }

            // Invalida otras sesiones/dispositivos antes de fijar la nueva clave.
            Auth::logoutOtherDevices($data['currentPassword']);
            $user->password = Hash::make($data['password']);
        }

        $user->fill([
            'name' => $data['name'] ?? $user->name,
            'email' => $data['email'] ?? $user->email,
            'phone' => array_key_exists('phone', $data) ? $data['phone'] : $user->phone,
            'job_title' => array_key_exists('jobTitle', $data) ? $data['jobTitle'] : $user->job_title,
        ])->save();

        Audit::log('Perfil actualizado', 'Perfil', ['id' => $user->id]);

        return new TeamMemberResource($user->fresh());
    }
}
