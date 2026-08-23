<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DomainResource;
use App\Models\Credential;
use App\Models\Domain;
use App\Support\Audit;
use Illuminate\Http\Request;

class DomainController extends Controller
{
    public function index()
    {
        return DomainResource::collection(Domain::query()->with(['client', 'server'])->latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'domainName' => ['required', 'string', 'max:255'],
            'clientId' => ['nullable', 'exists:clients,id'],
            'client' => ['nullable', 'string', 'max:255'],
            'serverId' => ['nullable', 'exists:servers,id'],
            'provider' => ['nullable', 'string', 'max:100'],
            'expiryDate' => ['nullable', 'date'],
            'autoRenew' => ['nullable', 'boolean'],
            'dnsZone' => ['nullable', 'string', 'max:100'],
            'nameserver1' => ['nullable', 'string', 'max:255'],
            'nameserver1Ip' => ['nullable', 'string', 'max:100'],
            'nameserver2' => ['nullable', 'string', 'max:255'],
            'nameserver2Ip' => ['nullable', 'string', 'max:100'],
        ]);

        $domain = Domain::query()->create([
            'domain_name' => $data['domainName'],
            'client_id' => $data['clientId'] ?? null,
            'client_name' => $data['client'] ?? null,
            'server_id' => $data['serverId'] ?? null,
            'provider' => $data['provider'] ?? null,
            'expiry_date' => $data['expiryDate'] ?? null,
            'auto_renew' => $data['autoRenew'] ?? false,
            'dns_zone' => $data['dnsZone'] ?? null,
            'nameserver1' => $data['nameserver1'] ?? null,
            'nameserver1_ip' => $data['nameserver1Ip'] ?? null,
            'nameserver2' => $data['nameserver2'] ?? null,
            'nameserver2_ip' => $data['nameserver2Ip'] ?? null,
        ]);

        Audit::log('Dominio registrado', 'Infraestructura', ['id' => $domain->id, 'domain' => $domain->domain_name]);

        return (new DomainResource($domain->load(['client', 'server'])))->response()->setStatusCode(201);
    }

    public function update(Request $request, Domain $domain)
    {
        $data = $request->validate([
            'domainName' => ['sometimes', 'string', 'max:255'],
            'clientId' => ['nullable', 'exists:clients,id'],
            'client' => ['nullable', 'string', 'max:255'],
            'serverId' => ['nullable', 'exists:servers,id'],
            'provider' => ['nullable', 'string', 'max:100'],
            'expiryDate' => ['nullable', 'date'],
            'autoRenew' => ['nullable', 'boolean'],
            'dnsZone' => ['nullable', 'string', 'max:100'],
            'nameserver1' => ['nullable', 'string', 'max:255'],
            'nameserver1Ip' => ['nullable', 'string', 'max:100'],
            'nameserver2' => ['nullable', 'string', 'max:255'],
            'nameserver2Ip' => ['nullable', 'string', 'max:100'],
        ]);

        $previousClientId = $domain->client_id;

        $domain->update([
            'domain_name' => $data['domainName'] ?? $domain->domain_name,
            'client_id' => array_key_exists('clientId', $data) ? $data['clientId'] : $domain->client_id,
            'client_name' => array_key_exists('client', $data) ? $data['client'] : $domain->client_name,
            'server_id' => array_key_exists('serverId', $data) ? $data['serverId'] : $domain->server_id,
            'provider' => array_key_exists('provider', $data) ? $data['provider'] : $domain->provider,
            'expiry_date' => array_key_exists('expiryDate', $data) ? $data['expiryDate'] : $domain->expiry_date,
            'auto_renew' => array_key_exists('autoRenew', $data) ? $data['autoRenew'] : $domain->auto_renew,
            'dns_zone' => array_key_exists('dnsZone', $data) ? $data['dnsZone'] : $domain->dns_zone,
            'nameserver1' => array_key_exists('nameserver1', $data) ? $data['nameserver1'] : $domain->nameserver1,
            'nameserver1_ip' => array_key_exists('nameserver1Ip', $data) ? $data['nameserver1Ip'] : $domain->nameserver1_ip,
            'nameserver2' => array_key_exists('nameserver2', $data) ? $data['nameserver2'] : $domain->nameserver2,
            'nameserver2_ip' => array_key_exists('nameserver2Ip', $data) ? $data['nameserver2Ip'] : $domain->nameserver2_ip,
        ]);

        // Si el dominio cambia de cliente, arrastra las credenciales vinculadas a ese dominio.
        if (
            array_key_exists('clientId', $data)
            && (int) ($domain->client_id ?? 0) !== (int) ($previousClientId ?? 0)
        ) {
            Credential::query()
                ->where('domain_id', $domain->id)
                ->update(['client_id' => $domain->client_id]);
        }

        Audit::log('Dominio actualizado', 'Infraestructura', [
            'id' => $domain->id,
            'client_id' => $domain->client_id,
            'synced_credentials' => array_key_exists('clientId', $data)
                && (int) ($domain->client_id ?? 0) !== (int) ($previousClientId ?? 0),
        ]);

        return new DomainResource($domain->load(['client', 'server']));
    }

    public function destroy(Domain $domain)
    {
        $domain->delete();
        Audit::log('Dominio eliminado', 'Infraestructura', ['id' => $domain->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }
}
