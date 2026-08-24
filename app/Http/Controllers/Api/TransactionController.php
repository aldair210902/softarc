<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TransactionResource;
use App\Models\Client;
use App\Models\Transaction;
use App\Support\Audit;
use App\Support\BillingDocuments;
use App\Support\BillingPdf;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index()
    {
        return TransactionResource::collection(
            Transaction::query()->with('client')->latest('date_received')->get()
        );
    }

    public function nextNumber(Request $request)
    {
        $data = $request->validate([
            'documentType' => ['nullable', 'string', 'in:Recibo,Boleta,Factura'],
            'emissionMode' => ['nullable', 'string', 'in:Prueba,Oficial'],
        ]);

        $type = $data['documentType'] ?? 'Recibo';
        $mode = $data['emissionMode'] ?? BillingDocuments::defaultEmissionMode();

        return response()->json([
            'invoiceNumber' => BillingDocuments::nextNumber($type, $mode),
            'documentType' => $type,
            'emissionMode' => $mode,
            'defaultEmissionMode' => BillingDocuments::defaultEmissionMode(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        $client = ! empty($data['clientId']) ? Client::query()->find($data['clientId']) : null;
        $documentType = $data['documentType'] ?? 'Recibo';
        $emissionMode = $data['emissionMode'] ?? BillingDocuments::defaultEmissionMode();
        $invoiceNumber = trim((string) ($data['invoiceNumber'] ?? ''));
        if ($invoiceNumber === '') {
            $invoiceNumber = BillingDocuments::nextNumber($documentType, $emissionMode);
        }

        $transaction = Transaction::query()->create([
            'subscription_id' => $data['subscriptionId'] ?? null,
            'client_id' => $data['clientId'] ?? null,
            'customer_name' => $data['customerName'] ?? $client?->business_name,
            'customer_document' => $data['customerDocument'] ?? $client?->document_number,
            'customer_address' => $data['customerAddress'] ?? null,
            'invoice_number' => $invoiceNumber,
            'document_type' => $documentType,
            'emission_mode' => $emissionMode,
            'concept' => $data['concept'],
            'amount_paid' => $data['amountPaid'] ?? $data['amount'],
            'payment_method' => $data['paymentMethod'],
            'operation_code' => $data['operationCode'] ?? null,
            'date_received' => $data['dateReceived'] ?? $data['issueDate'] ?? now()->toDateString(),
            'status' => $data['status'] ?? 'Pagado',
            'notes' => $data['notes'] ?? null,
        ]);

        Audit::log('Transacción creada', 'Finanzas', [
            'id' => $transaction->id,
            'document_type' => $transaction->document_type,
            'emission_mode' => $transaction->emission_mode,
        ]);

        return (new TransactionResource($transaction->load('client')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Transaction $transaction)
    {
        $data = $this->validated($request, updating: true);

        $client = array_key_exists('clientId', $data) && $data['clientId']
            ? Client::query()->find($data['clientId'])
            : $transaction->client;

        $transaction->update([
            'subscription_id' => array_key_exists('subscriptionId', $data) ? $data['subscriptionId'] : $transaction->subscription_id,
            'client_id' => array_key_exists('clientId', $data) ? $data['clientId'] : $transaction->client_id,
            'customer_name' => array_key_exists('customerName', $data)
                ? $data['customerName']
                : ($transaction->customer_name ?: $client?->business_name),
            'customer_document' => array_key_exists('customerDocument', $data)
                ? $data['customerDocument']
                : ($transaction->customer_document ?: $client?->document_number),
            'customer_address' => array_key_exists('customerAddress', $data) ? $data['customerAddress'] : $transaction->customer_address,
            'invoice_number' => array_key_exists('invoiceNumber', $data) ? $data['invoiceNumber'] : $transaction->invoice_number,
            'document_type' => $data['documentType'] ?? $transaction->document_type,
            'emission_mode' => $data['emissionMode'] ?? $transaction->emission_mode,
            'concept' => $data['concept'] ?? $transaction->concept,
            'amount_paid' => $data['amountPaid'] ?? $data['amount'] ?? $transaction->amount_paid,
            'payment_method' => $data['paymentMethod'] ?? $transaction->payment_method,
            'operation_code' => array_key_exists('operationCode', $data) ? $data['operationCode'] : $transaction->operation_code,
            'date_received' => $data['dateReceived'] ?? $data['issueDate'] ?? $transaction->date_received,
            'status' => $data['status'] ?? $transaction->status,
            'notes' => array_key_exists('notes', $data) ? $data['notes'] : $transaction->notes,
        ]);

        Audit::log('Transacción actualizada', 'Finanzas', ['id' => $transaction->id]);

        return new TransactionResource($transaction->load('client'));
    }

    public function destroy(Transaction $transaction)
    {
        $transaction->delete();

        Audit::log('Transacción eliminada', 'Finanzas', ['id' => $transaction->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }

    public function pdf(Transaction $transaction)
    {
        return BillingPdf::transaction($transaction);
    }

    private function validated(Request $request, bool $updating = false): array
    {
        $req = $updating ? 'sometimes' : 'required';

        return $request->validate([
            'subscriptionId' => ['nullable', 'exists:subscriptions,id'],
            'clientId' => ['nullable', 'exists:clients,id'],
            'invoiceNumber' => ['nullable', 'string', 'max:50'],
            'documentType' => ['nullable', 'string', 'in:Recibo,Boleta,Factura'],
            'emissionMode' => ['nullable', 'string', 'in:Prueba,Oficial'],
            'customerName' => ['nullable', 'string', 'max:255'],
            'customerDocument' => ['nullable', 'string', 'max:30'],
            'customerAddress' => ['nullable', 'string', 'max:255'],
            'concept' => [$req, 'string', 'max:255'],
            'amount' => [$req, 'numeric', 'min:0'],
            'amountPaid' => ['nullable', 'numeric', 'min:0'],
            'paymentMethod' => [$req, 'string', 'max:100'],
            'operationCode' => ['nullable', 'string', 'max:100'],
            'issueDate' => ['nullable', 'date'],
            'dateReceived' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
    }
}
