<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeamMemberResource;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class TeamController extends Controller
{
    public function index()
    {
        return TeamMemberResource::collection(User::query()->latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(8)],
            'phone' => ['nullable', 'string', 'max:50'],
            'jobTitle' => ['nullable', 'string', 'max:100'],
            'role' => ['nullable', 'string', 'max:100'],
            'permissions' => ['nullable', 'array'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'job_title' => $data['jobTitle'] ?? null,
            'role' => $data['role'] ?? 'Colaborador',
            'permissions' => $data['permissions'] ?? [],
            'status' => $data['status'] ?? 'Activo',
        ]);

        Audit::log('Miembro creado', 'Equipo', ['id' => $user->id, 'email' => $user->email]);

        return (new TeamMemberResource($user))->response()->setStatusCode(201);
    }

    public function update(Request $request, User $team)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($team->id)],
            'password' => ['nullable', 'string', Password::min(8)],
            'phone' => ['nullable', 'string', 'max:50'],
            'jobTitle' => ['nullable', 'string', 'max:100'],
            'role' => ['sometimes', 'string', 'max:100'],
            'permissions' => ['nullable', 'array'],
            'status' => ['sometimes', 'string', 'max:50'],
        ]);

        $team->update([
            'name' => $data['name'] ?? $team->name,
            'email' => $data['email'] ?? $team->email,
            'phone' => array_key_exists('phone', $data) ? $data['phone'] : $team->phone,
            'job_title' => array_key_exists('jobTitle', $data) ? $data['jobTitle'] : $team->job_title,
            'role' => $data['role'] ?? $team->role,
            'permissions' => array_key_exists('permissions', $data) ? $data['permissions'] : $team->permissions,
            'status' => $data['status'] ?? $team->status,
        ]);

        if (! empty($data['password'])) {
            $team->update(['password' => Hash::make($data['password'])]);
        }

        Audit::log('Miembro actualizado', 'Equipo', ['id' => $team->id]);

        return new TeamMemberResource($team->fresh());
    }

    public function destroy(User $team)
    {
        if ($team->id === auth()->id()) {
            return response()->json(['message' => 'No puedes eliminarte a ti mismo'], 422);
        }

        $team->delete();
        Audit::log('Miembro eliminado', 'Equipo', ['id' => $team->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }
}
