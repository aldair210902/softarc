<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionResource;
use App\Models\Subscription;
use App\Support\Audit;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function index()
    {
        return SubscriptionResource::collection(
            Subscription::query()->with('client')->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'clientId' => ['required', 'exists:clients,id'],
            'serviceName' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'frequency' => ['nullable', 'string', 'max:50'],
            'startDate' => ['required', 'date'],
            'nextPaymentDate' => ['required', 'date'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $subscription = Subscription::query()->create([
            'client_id' => $data['clientId'],
            'service_name' => $data['serviceName'],
            'amount' => $data['amount'],
            'frequency' => $data['frequency'] ?? 'Mensual',
            'start_date' => $data['startDate'],
            'next_payment_date' => $data['nextPaymentDate'],
            'status' => $data['status'] ?? 'Al Día',
        ]);

        Audit::log('Suscripción creada', 'Clientes', ['id' => $subscription->id]);

        return (new SubscriptionResource($subscription->load('client')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Subscription $subscription)
    {
        $data = $request->validate([
            'clientId' => ['sometimes', 'exists:clients,id'],
            'serviceName' => ['sometimes', 'string', 'max:255'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'frequency' => ['nullable', 'string', 'max:50'],
            'startDate' => ['sometimes', 'date'],
            'nextPaymentDate' => ['sometimes', 'date'],
            'status' => ['sometimes', 'string', 'max:50'],
        ]);

        $subscription->update([
            'client_id' => $data['clientId'] ?? $subscription->client_id,
            'service_name' => $data['serviceName'] ?? $subscription->service_name,
            'amount' => $data['amount'] ?? $subscription->amount,
            'frequency' => $data['frequency'] ?? $subscription->frequency,
            'start_date' => $data['startDate'] ?? $subscription->start_date,
            'next_payment_date' => $data['nextPaymentDate'] ?? $subscription->next_payment_date,
            'status' => $data['status'] ?? $subscription->status,
        ]);

        Audit::log('Suscripción actualizada', 'Clientes', ['id' => $subscription->id]);

        return new SubscriptionResource($subscription->load('client'));
    }

    public function destroy(Subscription $subscription)
    {
        $subscription->delete();

        Audit::log('Suscripción eliminada', 'Clientes', ['id' => $subscription->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }
}
