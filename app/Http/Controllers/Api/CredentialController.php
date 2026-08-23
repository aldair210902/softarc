<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CredentialResource;
use App\Models\Credential;
use App\Models\Domain;
use App\Support\Audit;
use Illuminate\Http\Request;

class CredentialController extends Controller
{
    public function index()
    {
        return CredentialResource::collection(
            Credential::query()->with(['client', 'domain.server'])->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'clientId' => ['nullable', 'exists:clients,id'],
            'domainId' => ['nullable', 'exists:domains,id'],
            'clientOrServer' => ['nullable', 'string', 'max:255'],
            'port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'encryption' => ['nullable', 'string', 'max:50'],
            'username' => ['nullable', 'string', 'max:255'],
            'secret' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
        ]);

        [$clientId, $domainId] = $this->resolveLinks($data['clientId'] ?? null, $data['domainId'] ?? null);
        [$host, $port, $encryption] = $this->normalizeAccess(
            $data['name'] ?? '',
            $data['category'] ?? '',
            $data['clientOrServer'] ?? null,
            $data['port'] ?? null,
            $data['encryption'] ?? null,
        );

        $credential = Credential::query()->create([
            'name' => $data['name'],
            'client_id' => $clientId,
            'domain_id' => $domainId,
            'client_or_server' => $host,
            'port' => $port,
            'encryption' => $encryption,
            'username' => $data['username'] ?? null,
            'secret' => $data['secret'],
            'category' => $data['category'] ?? null,
        ]);

        Audit::log('Credencial creada', 'Infraestructura', ['id' => $credential->id, 'name' => $credential->name], 'warning');

        return (new CredentialResource($credential->load(['client', 'domain.server'])))->response()->setStatusCode(201);
    }

    public function update(Request $request, Credential $credential)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'clientId' => ['nullable', 'exists:clients,id'],
            'domainId' => ['nullable', 'exists:domains,id'],
            'clientOrServer' => ['nullable', 'string', 'max:255'],
            'port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'encryption' => ['nullable', 'string', 'max:50'],
            'username' => ['nullable', 'string', 'max:255'],
            'secret' => ['sometimes', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
        ]);

        $clientId = array_key_exists('clientId', $data) ? ($data['clientId'] ?: null) : $credential->client_id;
        $domainId = array_key_exists('domainId', $data) ? ($data['domainId'] ?: null) : $credential->domain_id;
        [$clientId, $domainId] = $this->resolveLinks($clientId, $domainId);

        $name = $data['name'] ?? $credential->name;
        $category = array_key_exists('category', $data) ? $data['category'] : $credential->category;
        $rawHost = array_key_exists('clientOrServer', $data) ? $data['clientOrServer'] : $credential->client_or_server;
        $rawPort = array_key_exists('port', $data) ? $data['port'] : $credential->port;
        $rawEnc = array_key_exists('encryption', $data) ? $data['encryption'] : $credential->encryption;
        [$host, $port, $encryption] = $this->normalizeAccess($name, $category ?? '', $rawHost, $rawPort, $rawEnc);

        $payload = [
            'name' => $name,
            'client_id' => $clientId,
            'domain_id' => $domainId,
            'client_or_server' => $host,
            'port' => $port,
            'encryption' => $encryption,
            'username' => array_key_exists('username', $data) ? $data['username'] : $credential->username,
            'category' => $category,
        ];

        if (array_key_exists('secret', $data)) {
            $payload['secret'] = $data['secret'];
        }

        $credential->update($payload);
        Audit::log('Credencial actualizada', 'Infraestructura', ['id' => $credential->id], 'warning');

        return new CredentialResource($credential->fresh()->load(['client', 'domain.server']));
    }

    public function destroy(Credential $credential)
    {
        $credential->delete();
        Audit::log('Credencial eliminada', 'Infraestructura', ['id' => $credential->id], 'critical');

        return response()->json(['message' => 'Eliminado']);
    }

    public function reveal(Credential $credential)
    {
        $user = request()->user();
        if (! $user || ! $user->canAccess('credentials.reveal')) {
            return response()->json(['message' => 'No autorizado a revelar secretos.'], 403);
        }

        Audit::log('Credencial revelada', 'Infraestructura', [
            'id' => $credential->id,
            'name' => $credential->name,
        ], 'warning');

        return response()->json([
            'id' => (string) $credential->id,
            'secret' => $credential->secret,
        ]);
    }

    /**
     * Si hay dominio, hereda el cliente del dominio cuando no se envió clientId.
     *
     * @return array{0: int|null, 1: int|null}
     */
    private function resolveLinks(mixed $clientId, mixed $domainId): array
    {
        $clientId = $clientId ? (int) $clientId : null;
        $domainId = $domainId ? (int) $domainId : null;

        if ($domainId) {
            $domain = Domain::query()->find($domainId);
            if ($domain?->client_id && ! $clientId) {
                $clientId = (int) $domain->client_id;
            }
        }

        return [$clientId, $domainId];
    }

    /**
     * @return array{0: ?string, 1: ?int, 2: ?string}
     */
    private function normalizeAccess(string $name, string $category, mixed $host, mixed $port, mixed $encryption): array
    {
        $host = is_string($host) ? trim($host) : null;
        $port = $port !== null && $port !== '' ? (int) $port : null;
        $encryption = is_string($encryption) && $encryption !== '' ? $encryption : null;

        $hay = strtolower(trim($name.' '.$category.' '.($host ?? '')));
        $isFtp = str_contains($hay, 'ftp');

        if ($host && preg_match('/:(\d+)\s*$/', $host, $m)) {
            if (! $port) {
                $port = (int) $m[1];
            }
            $host = trim(preg_replace('/:\d+\s*$/', '', $host) ?? $host);
        }

        if ($isFtp) {
            $port = $port ?: 21;
            $encryption = $encryption ?: 'plain';
        }

        return [$host ?: null, $port, $encryption];
    }
}
