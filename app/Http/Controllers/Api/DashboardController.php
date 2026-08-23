<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Http\Resources\SubscriptionResource;
use App\Models\AuditLog;
use App\Models\Client;
use App\Models\Domain;
use App\Models\Expense;
use App\Models\Lead;
use App\Models\Server;
use App\Models\Subscription;
use App\Models\Transaction;
class DashboardController extends Controller
{
    public function __invoke()
    {
        $mrr = (float) Subscription::query()
            ->whereIn('status', ['Al Día', 'Por Vencer'])
            ->sum('amount');

        $activeClients = Client::query()->where('status', 'Activo')->count();
        $newLeads = Lead::query()->where('status', 'Nuevo Prospecto')->count();
        $totalLeads = Lead::query()->whereNotIn('status', ['Cliente Ganado', 'Cliente Perdido'])->count();

        $upcoming = Subscription::query()
            ->with('client')
            ->whereIn('status', ['Por Vencer', 'Vencido'])
            ->orderBy('next_payment_date')
            ->limit(6)
            ->get();

        $collected = (float) Transaction::query()
            ->where('status', 'Pagado')
            ->whereMonth('date_received', now()->month)
            ->whereYear('date_received', now()->year)
            ->sum('amount_paid');

        $expensesMonth = (float) Expense::query()
            ->where('status', 'Pagado')
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->sum('amount');

        $serversTotal = Server::query()->count();
        $serversOnline = Server::query()->where('node_status', 'Online')->count();
        $domainsExpiring = Domain::query()
            ->whereBetween('expiry_date', [now()->toDateString(), now()->addMonth()->toDateString()])
            ->count();

        $chartData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $chartData[] = [
                'name' => $month->translatedFormat('M'),
                'ingresos' => (float) Transaction::query()
                    ->where('status', 'Pagado')
                    ->whereMonth('date_received', $month->month)
                    ->whereYear('date_received', $month->year)
                    ->sum('amount_paid'),
                'gastos' => (float) Expense::query()
                    ->where('status', 'Pagado')
                    ->whereMonth('date', $month->month)
                    ->whereYear('date', $month->year)
                    ->sum('amount'),
            ];
        }

        $recentActivity = AuditLog::query()
            ->latest()
            ->limit(6)
            ->get();

        return response()->json([
            'mrr' => $mrr,
            'activeClients' => $activeClients,
            'newLeads' => $newLeads,
            'activeLeads' => $totalLeads,
            'collected' => $collected,
            'expensesMonth' => $expensesMonth,
            'serversOnline' => $serversOnline,
            'serversTotal' => $serversTotal,
            'domainsExpiring' => $domainsExpiring,
            'chartData' => $chartData,
            'upcomingCollections' => SubscriptionResource::collection($upcoming),
            'recentActivity' => AuditLogResource::collection($recentActivity),
        ]);
    }
}
