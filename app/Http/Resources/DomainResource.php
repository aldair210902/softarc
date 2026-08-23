<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Domain */
class DomainResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'domainName' => $this->domain_name,
            'client' => $this->client_name ?? $this->client?->business_name ?? 'Interno',
            'clientId' => $this->client_id ? (string) $this->client_id : '',
            'serverId' => $this->server_id ? (string) $this->server_id : '',
            'serverName' => $this->server?->name ?? '',
            'serverIp' => $this->server?->ip ?? '',
            'panelUrl' => $this->server?->panel_url ?? '',
            'webmailUrl' => $this->server?->webmail_url ?? '',
            'provider' => $this->provider ?? '',
            'expiryDate' => $this->expiry_date?->toDateString(),
            'autoRenew' => (bool) $this->auto_renew,
            'dnsZone' => $this->dns_zone ?? '',
            'nameserver1' => $this->nameserver1 ?? '',
            'nameserver1Ip' => $this->nameserver1_ip ?? '',
            'nameserver2' => $this->nameserver2 ?? '',
            'nameserver2Ip' => $this->nameserver2_ip ?? '',
        ];
    }
}
