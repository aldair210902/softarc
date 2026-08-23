<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LeadResource;
use App\Models\Lead;
use App\Support\Audit;
use App\Support\Notify;
use Illuminate\Http\Request;

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
            'status' => ['nullable', 'string', 'max:100'],
        ]);

        $lead = Lead::query()->create([
            'contact_name' => $data['contactName'],
            'company_name' => $data['companyName'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'service_of_interest' => $data['serviceOfInterest'] ?? null,
            'notes' => $data['notes'] ?? null,
            'status' => $data['status'] ?? 'Nuevo Prospecto',
        ]);

        Audit::log('Lead creado', 'CRM', ['id' => $lead->id]);

        Notify::toPermission(
            ['crm.manage', 'crm.view'],
            'lead',
            'Nuevo prospecto: '.$lead->company_name,
            $lead->contact_name.($lead->service_of_interest ? ' · '.$lead->service_of_interest : ''),
            '/admin/crm',
            ['leadId' => $lead->id],
            auth()->id()
        );

        return (new LeadResource($lead))->response()->setStatusCode(201);
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

        Audit::log('Lead actualizado', 'CRM', ['id' => $lead->id]);

        return new LeadResource($lead);
    }

    public function destroy(Lead $lead)
    {
        $lead->delete();

        Audit::log('Lead eliminado', 'CRM', ['id' => $lead->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }
}
