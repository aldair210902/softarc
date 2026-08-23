<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClientResource;
use App\Http\Resources\CredentialResource;
use App\Models\Client;
use App\Models\Credential;
use App\Models\Domain;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClientController extends Controller
{
    public function index()
    {
        return ClientResource::collection(Client::query()->latest()->get());
    }

    /**
     * Dominios, servidores y credenciales relacionadas al cliente (hub operativo).
     */
    public function hosting(Request $request, Client $client)
    {
        $domains = Domain::query()
            ->with('server')
            ->where(function ($q) use ($client) {
                $q->where('client_id', $client->id);
                if ($client->business_name) {
                    $q->orWhere('client_name', $client->business_name);
                }
            })
            ->orderBy('domain_name')
            ->get();

        $domainPayload = $domains->map(function (Domain $domain) {
            $server = $domain->server;

            return [
                'id' => (string) $domain->id,
                'domainName' => $domain->domain_name,
                'provider' => $domain->provider ?? '',
                'expiryDate' => $domain->expiry_date?->toDateString(),
                'autoRenew' => (bool) $domain->auto_renew,
                'serverId' => $domain->server_id ? (string) $domain->server_id : '',
                'serverName' => $server?->name ?? '',
                'serverIp' => $server?->ip ?? '',
                'serverProvider' => $server?->provider ?? '',
                'serverLocation' => $server?->location ?? '',
                'panelUrl' => $server?->panel_url ?? '',
                'webmailUrl' => $server?->webmail_url ?? '',
                'sslStatus' => $server?->ssl_status ?? '',
                'nodeStatus' => $server?->node_status ?? '',
            ];
        })->values();

        $servers = $domains
            ->pluck('server')
            ->filter()
            ->unique('id')
            ->values()
            ->map(fn ($server) => [
                'id' => (string) $server->id,
                'name' => $server->name,
                'ip' => $server->ip ?? '',
                'provider' => $server->provider ?? '',
                'location' => $server->location ?? '',
                'panelUrl' => $server->panel_url ?? '',
                'webmailUrl' => $server->webmail_url ?? '',
                'sslStatus' => $server->ssl_status ?? '',
                'nodeStatus' => $server->node_status ?? '',
                'domainsCount' => $domains->where('server_id', $server->id)->count(),
            ]);

        $credentials = [];
        $user = $request->user();
        if ($user && ($user->canAccess('credentials.view') || $user->canAccess('credentials.manage') || $user->canAccess('credentials.reveal'))) {
            $domainIds = $domains->pluck('id')->filter()->all();

            $matched = Credential::query()
                ->with(['client', 'domain.server'])
                ->where(function ($q) use ($client, $domainIds) {
                    $q->where('client_id', $client->id);
                    if ($domainIds !== []) {
                        $q->orWhereIn('domain_id', $domainIds);
                    }
                })
                ->latest('updated_at')
                ->limit(40)
                ->get();

            // Compatibilidad: credenciales antiguas sin FK (solo texto).
            if ($matched->count() < 40) {
                $needles = collect([
                    $client->business_name,
                    ...$domains->pluck('domain_name')->all(),
                    ...$servers->pluck('name')->all(),
                    ...$servers->pluck('ip')->all(),
                ])
                    ->filter(fn ($v) => is_string($v) && trim($v) !== '')
                    ->map(fn ($v) => Str::lower(trim($v)))
                    ->unique()
                    ->values();

                $already = $matched->pluck('id')->all();
                $legacy = Credential::query()
                    ->with(['client', 'domain.server'])
                    ->whereNull('client_id')
                    ->whereNull('domain_id')
                    ->latest('updated_at')
                    ->get()
                    ->filter(function (Credential $cred) use ($needles, $already) {
                        if (in_array($cred->id, $already, true)) {
                            return false;
                        }
                        $haystack = Str::lower(trim(($cred->client_or_server ?? '').' '.($cred->name ?? '')));
                        foreach ($needles as $needle) {
                            if ($needle !== '' && str_contains($haystack, $needle)) {
                                return true;
                            }
                        }

                        return false;
                    })
                    ->take(40 - $matched->count());

                $matched = $matched->concat($legacy)->values();
            }

            $credentials = CredentialResource::collection($matched)->resolve();
        }

        return response()->json([
            'domains' => $domainPayload,
            'servers' => $servers,
            'credentials' => $credentials,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'businessName' => ['required', 'string', 'max:255'],
            'documentNumber' => ['nullable', 'string', 'max:50'],
            'contactName' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'billingEmail' => ['nullable', 'email', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $client = Client::query()->create([
            'business_name' => $data['businessName'],
            'document_number' => $data['documentNumber'] ?? null,
            'contact_name' => $data['contactName'],
            'phone' => $data['phone'] ?? null,
            'billing_email' => $data['billingEmail'] ?? null,
            'status' => $data['status'] ?? 'Activo',
        ]);

        Audit::log('Cliente creado', 'Clientes', ['id' => $client->id]);

        return (new ClientResource($client))->response()->setStatusCode(201);
    }

    public function update(Request $request, Client $client)
    {
        $data = $request->validate([
            'businessName' => ['sometimes', 'string', 'max:255'],
            'documentNumber' => ['nullable', 'string', 'max:50'],
            'contactName' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'billingEmail' => ['nullable', 'email', 'max:255'],
            'status' => ['sometimes', 'string', 'max:50'],
        ]);

        $client->update([
            'business_name' => $data['businessName'] ?? $client->business_name,
            'document_number' => array_key_exists('documentNumber', $data) ? ($data['documentNumber'] ?: null) : $client->document_number,
            'contact_name' => $data['contactName'] ?? $client->contact_name,
            'phone' => array_key_exists('phone', $data) ? $data['phone'] : $client->phone,
            'billing_email' => array_key_exists('billingEmail', $data) ? $data['billingEmail'] : $client->billing_email,
            'status' => $data['status'] ?? $client->status,
        ]);

        Audit::log('Cliente actualizado', 'Clientes', ['id' => $client->id]);

        return new ClientResource($client);
    }

    public function destroy(Client $client)
    {
        $client->delete();

        Audit::log('Cliente eliminado', 'Clientes', ['id' => $client->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }
}
