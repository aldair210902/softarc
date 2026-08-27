<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClientResource;
use App\Http\Resources\LeadResource;
use App\Models\Client;
use App\Models\Lead;
use App\Support\Audit;
use App\Support\LeadAlerter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeadController extends Controller
{
    public function index()
    {
        return LeadResource::collection(Lead::query()->latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'contactName' => ['required', 'string', 'max:255'],
            'companyName' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'serviceOfInterest' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'meta' => ['nullable', 'array'],
            'status' => ['nullable', 'string', 'max:100'],
        ]);

        $meta = [];
        if (! empty($data['meta']) && is_array($data['meta'])) {
            foreach ($data['meta'] as $key => $value) {
                if (! is_string($key) || $key === '') {
                    continue;
                }
                if (is_scalar($value) || $value === null) {
                    $meta[$key] = (string) ($value ?? '');
                }
            }
        }

        $lead = Lead::query()->create([
            'contact_name' => $data['contactName'],
            'company_name' => $data['companyName'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'service_of_interest' => $data['serviceOfInterest'] ?? null,
            'notes' => $data['notes'] ?? null,
            'meta' => $meta ?: null,
            'status' => $data['status'] ?? 'Nuevo Prospecto',
        ]);

        Audit::log('Lead creado', 'CRM', ['id' => $lead->id]);

        // Campanita en admin + email a ventas / usuarios CRM
        LeadAlerter::notifyNew($lead, auth()->id());

        if ($lead->status === 'Cliente Ganado') {
            $this->ensureConvertedClient($lead);
        }

        return (new LeadResource($lead->fresh()))->response()->setStatusCode(201);
    }

    public function update(Request $request, Lead $lead)
    {
        $data = $request->validate([
            'contactName' => ['sometimes', 'string', 'max:255'],
            'companyName' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'serviceOfInterest' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'status' => ['sometimes', 'string', 'max:100'],
        ]);

        $lead->update([
            'contact_name' => $data['contactName'] ?? $lead->contact_name,
            'company_name' => $data['companyName'] ?? $lead->company_name,
            'phone' => array_key_exists('phone', $data) ? $data['phone'] : $lead->phone,
            'email' => array_key_exists('email', $data) ? $data['email'] : $lead->email,
            'service_of_interest' => array_key_exists('serviceOfInterest', $data) ? $data['serviceOfInterest'] : $lead->service_of_interest,
            'notes' => array_key_exists('notes', $data) ? $data['notes'] : $lead->notes,
            'status' => $data['status'] ?? $lead->status,
        ]);

        if ($lead->status === 'Cliente Ganado') {
            $this->ensureConvertedClient($lead);
        }

        Audit::log('Lead actualizado', 'CRM', ['id' => $lead->id]);

        return new LeadResource($lead->fresh());
    }

    public function convert(Lead $lead)
    {
        $client = $this->ensureConvertedClient($lead, true);

        Audit::log('Lead convertido a cliente', 'CRM', [
            'leadId' => $lead->id,
            'clientId' => $client->id,
        ]);

        return response()->json([
            'lead' => new LeadResource($lead->fresh()),
            'client' => new ClientResource($client),
            'clientId' => (string) $client->id,
        ]);
    }

    public function destroy(Lead $lead)
    {
        $lead->delete();

        Audit::log('Lead eliminado', 'CRM', ['id' => $lead->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }

    private function ensureConvertedClient(Lead $lead, bool $forceWon = false): Client
    {
        return DB::transaction(function () use ($lead, $forceWon) {
            if ($forceWon && $lead->status !== 'Cliente Ganado') {
                $lead->status = 'Cliente Ganado';
                $lead->save();
            }

            if ($lead->converted_client_id) {
                $existing = Client::query()->find($lead->converted_client_id);
                if ($existing) {
                    return $existing;
                }
            }

            $client = Client::query()
                ->where('business_name', $lead->company_name)
                ->first();

            if (! $client) {
                $client = Client::query()->create([
                    'business_name' => $lead->company_name,
                    'contact_name' => $lead->contact_name ?: $lead->company_name,
                    'phone' => $lead->phone,
                    'billing_email' => $lead->email,
                    'status' => 'Activo',
                ]);
            }

            $lead->converted_client_id = $client->id;
            $lead->save();

            return $client;
        });
    }
}
