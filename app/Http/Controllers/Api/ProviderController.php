<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProviderResource;
use App\Models\Provider;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProviderController extends Controller
{
    public function index(Request $request)
    {
        $query = Provider::query()->orderBy('name');

        if ($request->boolean('activeOnly')) {
            $query->where('is_active', true);
        }

        return ProviderResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $provider = Provider::query()->create($this->map($data));
        Audit::log('Proveedor creado', 'Infraestructura', ['id' => $provider->id, 'name' => $provider->name]);

        return (new ProviderResource($provider))->response()->setStatusCode(201);
    }

    public function update(Request $request, Provider $provider)
    {
        $data = $this->validated($request, $provider);
        $provider->update($this->map($data, $provider));
        Audit::log('Proveedor actualizado', 'Infraestructura', ['id' => $provider->id]);

        return new ProviderResource($provider);
    }

    public function destroy(Provider $provider)
    {
        $provider->delete();
        Audit::log('Proveedor eliminado', 'Infraestructura', ['id' => $provider->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }

    private function validated(Request $request, ?Provider $provider = null): array
    {
        return $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('providers', 'name')->ignore($provider?->id),
            ],
            'type' => ['nullable', 'string', Rule::in(['hosting', 'domain', 'both'])],
            'websiteUrl' => ['nullable', 'string', 'max:255'],
            'panelUrl' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'isActive' => ['nullable', 'boolean'],
        ]);
    }

    private function map(array $data, ?Provider $provider = null): array
    {
        return [
            'name' => $data['name'],
            'type' => $data['type'] ?? $provider?->type ?? 'both',
            'website_url' => array_key_exists('websiteUrl', $data) ? $data['websiteUrl'] : $provider?->website_url,
            'panel_url' => array_key_exists('panelUrl', $data) ? $data['panelUrl'] : $provider?->panel_url,
            'notes' => array_key_exists('notes', $data) ? $data['notes'] : $provider?->notes,
            'is_active' => array_key_exists('isActive', $data)
                ? (bool) $data['isActive']
                : ($provider?->is_active ?? true),
        ];
    }
}
