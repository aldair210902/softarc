<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CredentialResource;
use App\Http\Resources\DomainResource;
use App\Http\Resources\ServerResource;
use App\Models\Client;
use App\Models\Credential;
use App\Models\Domain;
use App\Models\Server;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HostingPackageController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'clientId' => ['nullable', 'exists:clients,id'],

            'serverName' => ['required', 'string', 'max:255'],
            'serverIp' => ['nullable', 'string', 'max:100'],
            'provider' => ['nullable', 'string', 'max:100'],
            'plan' => ['nullable', 'string', 'max:255'],
            'panelUrl' => ['nullable', 'string', 'max:255'],
            'webmailUrl' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:100'],

            'domainName' => ['required', 'string', 'max:255'],
            'expiryDate' => ['nullable', 'date'],
            'autoRenew' => ['nullable', 'boolean'],
            'dnsZone' => ['nullable', 'string', 'max:100'],
            'nameserver1' => ['nullable', 'string', 'max:255'],
            'nameserver1Ip' => ['nullable', 'string', 'max:100'],
            'nameserver2' => ['nullable', 'string', 'max:255'],
            'nameserver2Ip' => ['nullable', 'string', 'max:100'],

            'cpanelUsername' => ['nullable', 'string', 'max:255'],
            'cpanelPassword' => ['nullable', 'string', 'max:255'],
            'ftpHost' => ['nullable', 'string', 'max:255'],
            'ftpUsername' => ['nullable', 'string', 'max:255'],
            'ftpPassword' => ['nullable', 'string', 'max:255'],
            'webmailUsername' => ['nullable', 'string', 'max:255'],
            'webmailPassword' => ['nullable', 'string', 'max:255'],
        ]);

        $client = isset($data['clientId'])
            ? Client::query()->find($data['clientId'])
            : null;
        $clientName = $client?->business_name ?? 'Interno / Propietario';
        $provider = $data['provider'] ?? null;
        $domainName = trim($data['domainName']);
        $ref = $clientName === 'Interno / Propietario' ? $domainName : "{$clientName} · {$domainName}";

        $result = DB::transaction(function () use ($data, $client, $clientName, $provider, $domainName, $ref) {
            $server = Server::query()->create([
                'name' => $data['serverName'],
                'ip' => $data['serverIp'] ?? null,
                'provider' => $provider,
                'location' => $data['location'] ?? null,
                'category' => $data['category'] ?? 'Servidores cPanel',
                'hosted_projects' => $data['plan'] ?? null,
                'panel_url' => $data['panelUrl'] ?? null,
                'webmail_url' => $data['webmailUrl']
                    ?? (! empty($domainName) ? "http://{$domainName}/webmail" : null),
                'ssl_status' => 'Válido',
                'node_status' => 'Online',
                'ram_usage' => 0,
                'disk_usage' => 0,
            ]);

            $domain = Domain::query()->create([
                'domain_name' => $domainName,
                'client_id' => $client?->id,
                'client_name' => $clientName,
                'server_id' => $server->id,
                'provider' => $provider,
                'expiry_date' => $data['expiryDate'] ?? null,
                'auto_renew' => $data['autoRenew'] ?? true,
                'dns_zone' => $data['dnsZone'] ?? null,
                'nameserver1' => $data['nameserver1'] ?? null,
                'nameserver1_ip' => $data['nameserver1Ip'] ?? null,
                'nameserver2' => $data['nameserver2'] ?? null,
                'nameserver2_ip' => $data['nameserver2Ip'] ?? null,
            ]);

            $credentials = [];

            if (! empty($data['cpanelUsername']) && ! empty($data['cpanelPassword'])) {
                $credentials[] = Credential::query()->create([
                    'name' => "cPanel {$domainName}",
                    'client_id' => $client?->id,
                    'domain_id' => $domain->id,
                    'client_or_server' => $data['panelUrl'] ?: ($data['serverIp'] ?: $ref),
                    'username' => $data['cpanelUsername'],
                    'secret' => $data['cpanelPassword'],
                    'category' => 'cPanel / Hosting',
                ]);
            }

            if (! empty($data['ftpUsername']) && ! empty($data['ftpPassword'])) {
                $ftpHostRaw = $data['ftpHost'] ?? ("ftp.{$domainName}");
                $ftpPort = 21;
                $ftpHost = $ftpHostRaw;
                if (preg_match('/:(\d+)\s*$/', (string) $ftpHostRaw, $m)) {
                    $ftpPort = (int) $m[1];
                    $ftpHost = trim(preg_replace('/:\d+\s*$/', '', (string) $ftpHostRaw) ?? (string) $ftpHostRaw);
                }
                $credentials[] = Credential::query()->create([
                    'name' => "FTP {$domainName}",
                    'client_id' => $client?->id,
                    'domain_id' => $domain->id,
                    'client_or_server' => $ftpHost,
                    'port' => $ftpPort,
                    'encryption' => 'plain',
                    'username' => $data['ftpUsername'],
                    'secret' => $data['ftpPassword'],
                    'category' => 'cPanel / Hosting',
                ]);
            }

            if (! empty($data['webmailUsername']) && ! empty($data['webmailPassword'])) {
                $webmailHost = $data['webmailUrl']
                    ?? (! empty($domainName) ? "http://{$domainName}/webmail" : $ref);
                $credentials[] = Credential::query()->create([
                    'name' => "Webmail {$domainName}",
                    'client_id' => $client?->id,
                    'domain_id' => $domain->id,
                    'client_or_server' => $webmailHost,
                    'username' => $data['webmailUsername'],
                    'secret' => $data['webmailPassword'],
                    'category' => 'Webmail',
                ]);
            }

            return compact('server', 'domain', 'credentials');
        });

        Audit::log('Hosting registrado (wizard)', 'Infraestructura', [
            'server_id' => $result['server']->id,
            'domain_id' => $result['domain']->id,
            'credentials' => count($result['credentials']),
            'domain' => $domainName,
        ]);

        return response()->json([
            'server' => new ServerResource($result['server']),
            'domain' => new DomainResource($result['domain']->load(['client', 'server'])),
            'credentials' => CredentialResource::collection(collect($result['credentials'])),
        ], 201);
    }
}
