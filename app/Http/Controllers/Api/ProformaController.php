<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Proforma;
use App\Support\Audit;
use App\Support\BillingDocuments;
use App\Support\BillingPdf;
use Illuminate\Http\Request;

class ProformaController extends Controller
{
    public function index()
    {
        return Proforma::query()
            ->with('client')
            ->latest('issue_date')
            ->latest('id')
            ->get()
            ->map(fn (Proforma $p) => $this->payload($p));
    }

    public function nextNumber()
    {
        return response()->json([
            'number' => BillingDocuments::nextProformaNumber(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $client = ! empty($data['clientId']) ? Client::query()->find($data['clientId']) : null;
        $number = trim((string) ($data['number'] ?? ''));
        if ($number === '') {
            $number = BillingDocuments::nextProformaNumber();
        }

        $proforma = Proforma::query()->create([
            'number' => $number,
            'client_id' => $data['clientId'] ?? null,
            'customer_name' => $data['customerName'] ?? $client?->business_name,
            'customer_document' => $data['customerDocument'] ?? $client?->document_number,
            'customer_address' => $data['customerAddress'] ?? null,
            'concept' => $data['concept'],
            'amount' => $data['amount'],
            'currency_symbol' => $data['currencySymbol'] ?? 'S/',
            'issue_date' => $data['issueDate'] ?? now()->toDateString(),
            'valid_until' => $data['validUntil'] ?? null,
            'status' => $data['status'] ?? 'Borrador',
            'notes' => $data['notes'] ?? null,
        ]);

        Audit::log('Proforma creada', 'Finanzas', ['id' => $proforma->id, 'number' => $proforma->number]);

        return response()->json($this->payload($proforma->load('client')), 201);
    }

    public function update(Request $request, Proforma $proforma)
    {
        $data = $this->validated($request, true);
        $client = array_key_exists('clientId', $data) && $data['clientId']
            ? Client::query()->find($data['clientId'])
            : $proforma->client;

        $proforma->update([
            'number' => array_key_exists('number', $data) ? ($data['number'] ?: $proforma->number) : $proforma->number,
            'client_id' => array_key_exists('clientId', $data) ? $data['clientId'] : $proforma->client_id,
            'customer_name' => array_key_exists('customerName', $data) ? $data['customerName'] : ($proforma->customer_name ?: $client?->business_name),
            'customer_document' => array_key_exists('customerDocument', $data) ? $data['customerDocument'] : ($proforma->customer_document ?: $client?->document_number),
            'customer_address' => array_key_exists('customerAddress', $data) ? $data['customerAddress'] : $proforma->customer_address,
            'concept' => $data['concept'] ?? $proforma->concept,
            'amount' => $data['amount'] ?? $proforma->amount,
            'currency_symbol' => $data['currencySymbol'] ?? $proforma->currency_symbol,
            'issue_date' => $data['issueDate'] ?? $proforma->issue_date,
            'valid_until' => array_key_exists('validUntil', $data) ? $data['validUntil'] : $proforma->valid_until,
            'status' => $data['status'] ?? $proforma->status,
            'notes' => array_key_exists('notes', $data) ? $data['notes'] : $proforma->notes,
        ]);

        Audit::log('Proforma actualizada', 'Finanzas', ['id' => $proforma->id]);

        return response()->json($this->payload($proforma->load('client')));
    }

    public function destroy(Proforma $proforma)
    {
        $proforma->delete();
        Audit::log('Proforma eliminada', 'Finanzas', ['id' => $proforma->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }

    public function pdf(Proforma $proforma)
    {
        return BillingPdf::proforma($proforma);
    }

    private function validated(Request $request, bool $updating = false): array
    {
        $req = $updating ? 'sometimes' : 'required';

        return $request->validate([
            'number' => ['nullable', 'string', 'max:50'],
            'clientId' => ['nullable', 'exists:clients,id'],
            'customerName' => ['nullable', 'string', 'max:255'],
            'customerDocument' => ['nullable', 'string', 'max:30'],
            'customerAddress' => ['nullable', 'string', 'max:255'],
            'concept' => [$req, 'string', 'max:255'],
            'amount' => [$req, 'numeric', 'min:0'],
            'currencySymbol' => ['nullable', 'string', 'max:10'],
            'issueDate' => ['nullable', 'date'],
            'validUntil' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'in:Borrador,Enviada,Aceptada,Anulada'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Proforma $p): array
    {
        return [
            'id' => (string) $p->id,
            'number' => $p->number,
            'clientId' => $p->client_id ? (string) $p->client_id : '',
            'clientName' => $p->customer_name ?: ($p->client?->business_name ?? ''),
            'customerName' => $p->customer_name ?: ($p->client?->business_name ?? ''),
            'customerDocument' => $p->customer_document ?: ($p->client?->document_number ?? ''),
            'customerAddress' => $p->customer_address ?? '',
            'concept' => $p->concept,
            'amount' => (float) $p->amount,
            'currencySymbol' => $p->currency_symbol,
            'issueDate' => $p->issue_date?->toDateString(),
            'validUntil' => $p->valid_until?->toDateString(),
            'status' => $p->status,
            'notes' => $p->notes ?? '',
        ];
    }
}
