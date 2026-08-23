<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Credential */
class CredentialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $canReveal = (bool) $request->user()?->canAccess('credentials.reveal');
        $isFtp = $this->isFtp();
        $domainName = $this->domain?->domain_name ?? '';
        $serverIp = $this->domain?->server?->ip ?? '';
        $storedHost = trim((string) ($this->client_or_server ?? ''));

        $ftpHosts = [];
        if ($isFtp) {
            if ($serverIp !== '') {
                $ftpHosts[] = $serverIp;
            }
            if ($domainName !== '') {
                $ftpHosts[] = 'ftp.'.$domainName;
            }
            if ($storedHost !== '' && ! in_array($storedHost, $ftpHosts, true)) {
                array_unshift($ftpHosts, $storedHost);
            }
            $ftpHosts = array_values(array_unique($ftpHosts));
        }

        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'clientId' => $this->client_id ? (string) $this->client_id : '',
            'clientName' => $this->client?->business_name ?? '',
            'domainId' => $this->domain_id ? (string) $this->domain_id : '',
            'domainName' => $domainName,
            'serverIp' => $serverIp,
            'clientOrServer' => $this->client_or_server ?? '',
            'port' => $this->port,
            'encryption' => $this->encryption ?? ($isFtp ? 'plain' : ''),
            'isFtp' => $isFtp,
            'ftpHosts' => $ftpHosts,
            'username' => $this->username ?? '',
            // No descifrar en el listado: evita lentitud. El secreto se pide al revelar.
            'secret' => null,
            'secretMasked' => '••••••••••••',
            'canReveal' => $canReveal,
            'category' => $this->category ?? '',
            'lastModified' => $this->updated_at?->toDateString(),
        ];
    }
}
