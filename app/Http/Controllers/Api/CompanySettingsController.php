<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CompanySettingsController extends Controller
{
    /** @var list<string> */
    private const PUBLIC_KEYS = [
        'legalName',
        'commercialName',
        'logoUrl',
        'logotipoUrl',
        'logotipoLightUrl',
        'logotipoDarkUrl',
        'isotipoUrl',
        'isotipoLightUrl',
        'isotipoDarkUrl',
        'imagotipoUrl',
        'imagotipoLightUrl',
        'imagotipoDarkUrl',
        'isologoUrl',
        'isologoLightUrl',
        'isologoDarkUrl',
        'ruc',
        'address',
        'city',
        'country',
        'legalRepresentative',
        'brandSlogan',
        'salesPhone',
        'salesWhatsapp',
        'whatsappWelcomeMessage',
        'supportPhone',
        'salesEmail',
        'supportEmail',
        'businessHours',
        'instagramUrl',
        'tiktokUrl',
        'linkedinUrl',
        'facebookUrl',
        'youtubeUrl',
        'slaUptime',
        'serverLatency',
        'storageType',
        'defaultDeliveryDays',
        'currencySymbol',
        'currencyCode',
        'variashopDemoUrl',
    ];

    public function show(Request $request)
    {
        $settings = CompanySetting::query()->first();
        $data = $settings?->data ?? [];

        $user = Auth::guard('web')->user() ?? $request->user();
        if ($user && $user->canAccess('settings.manage')) {
            return response()->json($data);
        }

        return response()->json($this->publicOnly($data));
    }

    public function update(Request $request)
    {
        $data = $request->all();
        unset($data['_method']);

        if ($data === []) {
            return response()->json(['message' => 'No hay datos para actualizar.'], 422);
        }

        $settings = CompanySetting::query()->first();
        if (! $settings) {
            $settings = CompanySetting::query()->create(['data' => $data]);
        } else {
            $merged = array_merge($settings->data ?? [], $data);
            $settings->update(['data' => $merged]);
        }

        Audit::log('Configuración actualizada', 'Sistema', ['keys' => array_keys($data)]);

        return response()->json($settings->fresh()->data);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function publicOnly(array $data): array
    {
        return array_intersect_key($data, array_flip(self::PUBLIC_KEYS));
    }
}
