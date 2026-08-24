<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ResellerPlanResource;
use App\Models\ResellerPlan;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ResellerPlanController extends Controller
{
    /** Catálogo público (sin costos). */
    public function publicIndex()
    {
        $plans = ResellerPlan::query()
            ->with('provider')
            ->where('is_active', true)
            ->where('is_public', true)
            ->orderByDesc('is_featured')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return ResellerPlanResource::collection($plans);
    }

    public function index()
    {
        return ResellerPlanResource::collection(
            ResellerPlan::query()
                ->with('provider')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $plan = ResellerPlan::query()->create($this->map($data));
        Audit::log('Plan de reventa creado', 'Infraestructura', ['id' => $plan->id, 'name' => $plan->name]);

        return (new ResellerPlanResource($plan->load('provider')))->response()->setStatusCode(201);
    }

    public function update(Request $request, ResellerPlan $resellerPlan)
    {
        $data = $this->validated($request, $resellerPlan);
        $resellerPlan->update($this->map($data, $resellerPlan));
        Audit::log('Plan de reventa actualizado', 'Infraestructura', ['id' => $resellerPlan->id]);

        return new ResellerPlanResource($resellerPlan->load('provider'));
    }

    public function destroy(ResellerPlan $resellerPlan)
    {
        $resellerPlan->delete();
        Audit::log('Plan de reventa eliminado', 'Infraestructura', ['id' => $resellerPlan->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }

    private function validated(Request $request, ?ResellerPlan $plan = null): array
    {
        return $request->validate([
            'providerId' => ['nullable', 'exists:providers,id'],
            'name' => ['required', 'string', 'max:150'],
            'type' => ['nullable', 'string', Rule::in(['hosting', 'domain', 'bundle'])],
            'providerPlanName' => ['nullable', 'string', 'max:150'],
            'costPrice' => ['nullable', 'numeric', 'min:0'],
            'sellPrice' => ['required', 'numeric', 'min:0'],
            'billingCycle' => ['nullable', 'string', Rule::in(['Mensual', 'Anual', 'Bienal', 'Único'])],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'isPublic' => ['nullable', 'boolean'],
            'isActive' => ['nullable', 'boolean'],
            'isFeatured' => ['nullable', 'boolean'],
            'sortOrder' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
    }

    private function map(array $data, ?ResellerPlan $plan = null): array
    {
        return [
            'provider_id' => array_key_exists('providerId', $data)
                ? ($data['providerId'] ?: null)
                : $plan?->provider_id,
            'name' => $data['name'] ?? $plan?->name,
            'type' => $data['type'] ?? $plan?->type ?? 'hosting',
            'provider_plan_name' => array_key_exists('providerPlanName', $data)
                ? $data['providerPlanName']
                : $plan?->provider_plan_name,
            'cost_price' => array_key_exists('costPrice', $data)
                ? (float) $data['costPrice']
                : ($plan?->cost_price ?? 0),
            'sell_price' => array_key_exists('sellPrice', $data)
                ? (float) $data['sellPrice']
                : ($plan?->sell_price ?? 0),
            'billing_cycle' => $data['billingCycle'] ?? $plan?->billing_cycle ?? 'Anual',
            'features' => array_key_exists('features', $data)
                ? array_values(array_filter($data['features'] ?? []))
                : ($plan?->features ?? []),
            'description' => array_key_exists('description', $data)
                ? $data['description']
                : $plan?->description,
            'is_public' => array_key_exists('isPublic', $data)
                ? (bool) $data['isPublic']
                : ($plan?->is_public ?? true),
            'is_active' => array_key_exists('isActive', $data)
                ? (bool) $data['isActive']
                : ($plan?->is_active ?? true),
            'is_featured' => array_key_exists('isFeatured', $data)
                ? (bool) $data['isFeatured']
                : ($plan?->is_featured ?? false),
            'sort_order' => array_key_exists('sortOrder', $data)
                ? (int) $data['sortOrder']
                : ($plan?->sort_order ?? 0),
            'notes' => array_key_exists('notes', $data) ? $data['notes'] : $plan?->notes,
        ];
    }
}
