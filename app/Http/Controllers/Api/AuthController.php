<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuthUserResource;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $remember = $request->boolean('remember', false);

        if (! Auth::attempt($credentials, $remember)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciales incorrectas.'],
            ]);
        }

        /** @var User $user */
        $user = $request->user();

        if (! $user->isActive()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => ['Tu cuenta está inactiva. Contacta al administrador.'],
            ]);
        }

        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();

        Audit::log('Inicio de sesión', 'Auth', ['email' => $user->email]);

        return response()->json([
            'user' => new AuthUserResource($user),
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            Audit::log('Cierre de sesión', 'Auth', ['email' => $user->email]);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sesión cerrada']);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        if ($user && ! $user->isActive()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json(['message' => 'Cuenta inactiva'], 403);
        }

        return response()->json([
            'user' => new AuthUserResource($user),
        ]);
    }
}
