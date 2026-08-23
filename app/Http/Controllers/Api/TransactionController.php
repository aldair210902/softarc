<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use App\Support\Audit;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index()
    {
        return TransactionResource::collection(
            Transaction::query()->with('client')->latest('date_received')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'subscriptionId' => ['nullable', 'exists:subscriptions,id'],
            'clientId' => ['nullable', 'exists:clients,id'],
            'invoiceNumber' => ['nullable', 'string', 'max:50'],
            'concept' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'amountPaid' => ['nullable', 'numeric', 'min:0'],
            'paymentMethod' => ['required', 'string', 'max:100'],
            'operationCode' => ['nullable', 'string', 'max:100'],
            'issueDate' => ['nullable', 'date'],
            'dateReceived' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $transaction = Transaction::query()->create([
            'subscription_id' => $data['subscriptionId'] ?? null,
            'client_id' => $data['clientId'] ?? null,
            'invoice_number' => $data['invoiceNumber'] ?? null,
            'concept' => $data['concept'],
            'amount_paid' => $data['amountPaid'] ?? $data['amount'],
            'payment_method' => $data['paymentMethod'],
            'operation_code' => $data['operationCode'] ?? null,
            'date_received' => $data['dateReceived'] ?? $data['issueDate'] ?? now()->toDateString(),
            'status' => $data['status'] ?? 'Pagado',
        ]);

        Audit::log('Transacción creada', 'Finanzas', ['id' => $transaction->id]);

        return (new TransactionResource($transaction->load('client')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Transaction $transaction)
    {
        $data = $request->validate([
            'subscriptionId' => ['nullable', 'exists:subscriptions,id'],
            'clientId' => ['nullable', 'exists:clients,id'],
            'invoiceNumber' => ['nullable', 'string', 'max:50'],
            'concept' => ['sometimes', 'string', 'max:255'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'amountPaid' => ['nullable', 'numeric', 'min:0'],
            'paymentMethod' => ['sometimes', 'string', 'max:100'],
            'operationCode' => ['nullable', 'string', 'max:100'],
            'issueDate' => ['nullable', 'date'],
            'dateReceived' => ['nullable', 'date'],
            'status' => ['sometimes', 'string', 'max:50'],
        ]);

        $transaction->update([
            'subscription_id' => array_key_exists('subscriptionId', $data) ? $data['subscriptionId'] : $transaction->subscription_id,
            'client_id' => array_key_exists('clientId', $data) ? $data['clientId'] : $transaction->client_id,
            'invoice_number' => array_key_exists('invoiceNumber', $data) ? $data['invoiceNumber'] : $transaction->invoice_number,
            'concept' => $data['concept'] ?? $transaction->concept,
            'amount_paid' => $data['amountPaid'] ?? $data['amount'] ?? $transaction->amount_paid,
            'payment_method' => $data['paymentMethod'] ?? $transaction->payment_method,
            'operation_code' => array_key_exists('operationCode', $data) ? $data['operationCode'] : $transaction->operation_code,
            'date_received' => $data['dateReceived'] ?? $data['issueDate'] ?? $transaction->date_received,
            'status' => $data['status'] ?? $transaction->status,
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
}
