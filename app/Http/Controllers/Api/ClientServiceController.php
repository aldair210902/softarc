<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClientServiceResource;
use App\Models\Client;
use App\Models\ClientService;
use App\Models\ResellerPlan;
use App\Models\Subscription;
use App\Support\Audit;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ClientServiceController extends Controller
{
    public function index(Request $request)
    {
        $query = ClientService::query()
            ->with(['client', 'plan.provider'])
            ->latest();

        if ($request->filled('clientId')) {
            $query->where('client_id', $request->input('clientId'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return ClientServiceResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $plan = ! empty($data['resellerPlanId'])
            ? ResellerPlan::query()->with('provider')->find($data['resellerPlanId'])
            : null;

        $service = DB::transaction(function () use ($data, $plan, $request) {
            $label = $data['serviceLabel']
                ?? $plan?->name
                ?? 'Servicio de reventa';

            $cost = array_key_exists('costPrice', $data)
                ? (float) $data['costPrice']
                : (float) ($plan?->cost_price ?? 0);
            $sell = array_key_exists('sellPrice', $data)
                ? (float) $data['sellPrice']
                : (float) ($plan?->sell_price ?? 0);
            $cycle = $data['billingCycle'] ?? $plan?->billing_cycle ?? 'Anual';
            $type = $data['type'] ?? $plan?->type ?? 'hosting';
            $start = $data['startDate'] ?? now()->toDateString();
            $renew = $data['renewDate'] ?? $this->defaultRenewDate($start, $cycle);

            $subscriptionId = null;
            if ($request->boolean('createSubscription')) {
                $client = Client::query()->findOrFail($data['clientId']);
                $subscription = Subscription::query()->create([
                    'client_id' => $client->id,
                    'service_name' => $label.(! empty($data['domainName']) ? ' · '.$data['domainName'] : ''),
                    'amount' => $sell,
                    'frequency' => $cycle === 'Único' ? 'Anual' : $cycle,
                    'start_date' => $start,
                    'next_payment_date' => $renew,
                    'status' => 'Al Día',
                ]);
                $subscriptionId = $subscription->id;
            }

            return ClientService::query()->create([
                'client_id' => $data['clientId'],
                'reseller_plan_id' => $plan?->id,
                'service_label' => $label,
                'type' => $type,
                'domain_name' => $data['domainName'] ?? null,
                'cost_price' => $cost,
                'sell_price' => $sell,
                'billing_cycle' => $cycle,
                'status' => $data['status'] ?? 'Pendiente',
                'start_date' => $start,
                'renew_date' => $renew,
                'domain_id' => $data['domainId'] ?? null,
                'server_id' => $data['serverId'] ?? null,
                'subscription_id' => $subscriptionId,
                'provider_name' => $data['providerName']
                    ?? $plan?->provider?->name
                    ?? null,
                'delivery_notes' => $data['deliveryNotes'] ?? null,
                'internal_notes' => $data['internalNotes'] ?? null,
            ]);
        });

        Audit::log('Servicio de reventa asignado', 'Infraestructura', [
            'id' => $service->id,
            'client_id' => $service->client_id,
        ]);

        return (new ClientServiceResource($service->load(['client', 'plan'])))->response()->setStatusCode(201);
    }

    public function update(Request $request, ClientService $clientService)
    {
        $data = $this->validated($request, true);

        $clientService->update([
            'client_id' => $data['clientId'] ?? $clientService->client_id,
            'reseller_plan_id' => array_key_exists('resellerPlanId', $data)
                ? ($data['resellerPlanId'] ?: null)
                : $clientService->reseller_plan_id,
            'service_label' => $data['serviceLabel'] ?? $clientService->service_label,
            'type' => $data['type'] ?? $clientService->type,
            'domain_name' => array_key_exists('domainName', $data)
                ? $data['domainName']
                : $clientService->domain_name,
            'cost_price' => array_key_exists('costPrice', $data)
                ? (float) $data['costPrice']
                : $clientService->cost_price,
            'sell_price' => array_key_exists('sellPrice', $data)
                ? (float) $data['sellPrice']
                : $clientService->sell_price,
            'billing_cycle' => $data['billingCycle'] ?? $clientService->billing_cycle,
            'status' => $data['status'] ?? $clientService->status,
            'start_date' => $data['startDate'] ?? $clientService->start_date,
            'renew_date' => $data['renewDate'] ?? $clientService->renew_date,
            'domain_id' => array_key_exists('domainId', $data)
                ? ($data['domainId'] ?: null)
                : $clientService->domain_id,
            'server_id' => array_key_exists('serverId', $data)
                ? ($data['serverId'] ?: null)
                : $clientService->server_id,
            'provider_name' => array_key_exists('providerName', $data)
                ? $data['providerName']
                : $clientService->provider_name,
            'delivery_notes' => array_key_exists('deliveryNotes', $data)
                ? $data['deliveryNotes']
                : $clientService->delivery_notes,
            'internal_notes' => array_key_exists('internalNotes', $data)
                ? $data['internalNotes']
                : $clientService->internal_notes,
        ]);

        Audit::log('Servicio de reventa actualizado', 'Infraestructura', ['id' => $clientService->id]);

        return new ClientServiceResource($clientService->load(['client', 'plan']));
    }

    public function destroy(ClientService $clientService)
    {
        $clientService->delete();
        Audit::log('Servicio de reventa eliminado', 'Infraestructura', ['id' => $clientService->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'clientId' => [$req, 'exists:clients,id'],
            'resellerPlanId' => ['nullable', 'exists:reseller_plans,id'],
            'serviceLabel' => ['nullable', 'string', 'max:200'],
            'type' => ['nullable', 'string', Rule::in(['hosting', 'domain', 'bundle'])],
            'domainName' => ['nullable', 'string', 'max:255'],
            'costPrice' => ['nullable', 'numeric', 'min:0'],
            'sellPrice' => ['nullable', 'numeric', 'min:0'],
            'billingCycle' => ['nullable', 'string', Rule::in(['Mensual', 'Anual', 'Bienal', 'Único'])],
            'status' => ['nullable', 'string', Rule::in(['Pendiente', 'Activo', 'Suspendido', 'Cancelado', 'Vencido'])],
            'startDate' => ['nullable', 'date'],
            'renewDate' => ['nullable', 'date'],
            'domainId' => ['nullable', 'exists:domains,id'],
            'serverId' => ['nullable', 'exists:servers,id'],
            'providerName' => ['nullable', 'string', 'max:150'],
            'deliveryNotes' => ['nullable', 'string', 'max:5000'],
            'internalNotes' => ['nullable', 'string', 'max:5000'],
            'createSubscription' => ['nullable', 'boolean'],
        ]);
    }

    private function defaultRenewDate(string $start, string $cycle): string
    {
        $date = Carbon::parse($start);

        return match ($cycle) {
            'Mensual' => $date->copy()->addMonth()->toDateString(),
            'Bienal' => $date->copy()->addYears(2)->toDateString(),
            'Único' => $date->copy()->addYear()->toDateString(),
            default => $date->copy()->addYear()->toDateString(),
        };
    }
}
