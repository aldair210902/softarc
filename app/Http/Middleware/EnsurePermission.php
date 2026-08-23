<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    public function handle(Request $request, Closure $next, string ...$abilities): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        foreach ($abilities as $ability) {
            if ($user->canAccess($ability)) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'No tienes permiso para realizar esta acción.',
            'required' => $abilities,
        ], 403);
    }
}
