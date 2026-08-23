<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServerResource;
use App\Models\Server;
use App\Support\Audit;
use Illuminate\Http\Request;

class ServerController extends Controller
{
    public function index()
    {
        return ServerResource::collection(Server::query()->latest()->get());
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $server = Server::query()->create($this->map($data));
        Audit::log('Servidor registrado', 'Infraestructura', ['id' => $server->id, 'name' => $server->name]);

        return (new ServerResource($server))->response()->setStatusCode(201);
    }

    public function update(Request $request, Server $server)
    {
        $data = $this->validated($request, false);
        $server->update($this->map($data, $server));
        Audit::log('Servidor actualizado', 'Infraestructura', ['id' => $server->id]);

        return new ServerResource($server);
    }

    public function destroy(Server $server)
    {
        $server->delete();
        Audit::log('Servidor eliminado', 'Infraestructura', ['id' => $server->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }

    private function validated(Request $request, bool $creating = true): array
    {
        return $request->validate([
            'name' => [$creating ? 'required' : 'sometimes', 'string', 'max:255'],
            'ip' => ['nullable', 'string', 'max:100'],
            'provider' => ['nullable', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', 'string', 'max:100'],
            'ramUsage' => ['nullable', 'integer', 'min:0', 'max:100'],
            'ramLabel' => ['nullable', 'string', 'max:50'],
            'diskUsage' => ['nullable', 'integer', 'min:0', 'max:100'],
            'diskLabel' => ['nullable', 'string', 'max:50'],
            'hostedProjects' => ['nullable', 'string'],
            'sslStatus' => ['nullable', 'string', 'max:50'],
            'nodeStatus' => ['nullable', 'string', 'max:50'],
            'panelUrl' => ['nullable', 'string', 'max:255'],
            'webmailUrl' => ['nullable', 'string', 'max:255'],
        ]);
    }

    private function map(array $data, ?Server $server = null): array
    {
        return [
            'name' => $data['name'] ?? $server?->name,
            'ip' => array_key_exists('ip', $data) ? $data['ip'] : $server?->ip,
            'provider' => array_key_exists('provider', $data) ? $data['provider'] : $server?->provider,
            'location' => array_key_exists('location', $data) ? $data['location'] : $server?->location,
            'category' => array_key_exists('category', $data) ? $data['category'] : $server?->category,
            'ram_usage' => $data['ramUsage'] ?? $server?->ram_usage ?? 0,
            'ram_label' => array_key_exists('ramLabel', $data) ? $data['ramLabel'] : $server?->ram_label,
            'disk_usage' => $data['diskUsage'] ?? $server?->disk_usage ?? 0,
            'disk_label' => array_key_exists('diskLabel', $data) ? $data['diskLabel'] : $server?->disk_label,
            'hosted_projects' => array_key_exists('hostedProjects', $data) ? $data['hostedProjects'] : $server?->hosted_projects,
            'ssl_status' => $data['sslStatus'] ?? $server?->ssl_status ?? 'Válido',
            'node_status' => $data['nodeStatus'] ?? $server?->node_status ?? 'Online',
            'panel_url' => array_key_exists('panelUrl', $data) ? $data['panelUrl'] : $server?->panel_url,
            'webmail_url' => array_key_exists('webmailUrl', $data) ? $data['webmailUrl'] : $server?->webmail_url,
        ];
    }
}
