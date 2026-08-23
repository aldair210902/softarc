<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Support\Audit;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index()
    {
        return ExpenseResource::collection(Expense::query()->latest('date')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'provider' => ['required', 'string', 'max:255'],
            'concept' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'frequency' => ['nullable', 'string', 'max:50'],
            'amount' => ['required', 'numeric', 'min:0'],
            'date' => ['required', 'date'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $expense = Expense::query()->create([
            'provider' => $data['provider'],
            'concept' => $data['concept'],
            'category' => $data['category'],
            'frequency' => $data['frequency'] ?? 'Mensual',
            'amount' => $data['amount'],
            'date' => $data['date'],
            'status' => $data['status'] ?? 'Pendiente',
        ]);

        Audit::log('Gasto creado', 'Finanzas', ['id' => $expense->id]);

        return (new ExpenseResource($expense))->response()->setStatusCode(201);
    }

    public function update(Request $request, Expense $expense)
    {
        $data = $request->validate([
            'provider' => ['sometimes', 'string', 'max:255'],
            'concept' => ['sometimes', 'string', 'max:255'],
            'category' => ['sometimes', 'string', 'max:100'],
            'frequency' => ['nullable', 'string', 'max:50'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'date' => ['sometimes', 'date'],
            'status' => ['sometimes', 'string', 'max:50'],
        ]);

        $expense->update([
            'provider' => $data['provider'] ?? $expense->provider,
            'concept' => $data['concept'] ?? $expense->concept,
            'category' => $data['category'] ?? $expense->category,
            'frequency' => $data['frequency'] ?? $expense->frequency,
            'amount' => $data['amount'] ?? $expense->amount,
            'date' => $data['date'] ?? $expense->date,
            'status' => $data['status'] ?? $expense->status,
        ]);

        Audit::log('Gasto actualizado', 'Finanzas', ['id' => $expense->id]);

        return new ExpenseResource($expense);
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();

        Audit::log('Gasto eliminado', 'Finanzas', ['id' => $expense->id], 'warning');

        return response()->json(['message' => 'Eliminado']);
    }
}
