<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && strcasecmp((string) $user->status, 'Activo') !== 0) {
            auth('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'message' => 'Tu cuenta está inactiva. Contacta al administrador.',
            ], 403);
        }

        return $next($request);
    }
}
