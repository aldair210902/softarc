<?php

namespace App\Console\Commands;

use App\Models\Domain;
use App\Models\Subscription;
use App\Support\Notify;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class SoftArcExpiryAlerts extends Command
{
    protected $signature = 'softarc:expiry-alerts';

    protected $description = 'Notifica dominios y suscripciones por vencer (30/15/7/0 días)';

    public function handle(): int
    {
        $today = Carbon::today();
        $windows = [0, 7, 15, 30];
        $created = 0;

        foreach ($windows as $days) {
            $target = $today->copy()->addDays($days);

            Domain::query()
                ->with('client')
                ->whereDate('expiry_date', $target)
                ->get()
                ->each(function (Domain $domain) use ($days, &$created) {
                    $label = $days === 0
                        ? 'vence HOY'
                        : "vence en {$days} día".($days === 1 ? '' : 's');
                    $client = $domain->client?->business_name ?: 'Sin cliente';
                    Notify::toPermission(
                        ['domains.manage', 'domains.view', 'dashboard.view'],
                        'expiry',
                        "Dominio {$domain->domain_name} {$label}",
                        "{$client} · Renovar o revisar DNS/hosting",
                        '/admin/infra/domains',
                        ['domainId' => $domain->id, 'days' => $days]
                    );
                    $created++;
                });

            Subscription::query()
                ->with('client')
                ->whereIn('status', ['Al Día', 'Por Vencer'])
                ->whereDate('next_payment_date', $target)
                ->get()
                ->each(function (Subscription $sub) use ($days, &$created) {
                    $label = $days === 0
                        ? 'cobro HOY'
                        : "cobro en {$days} día".($days === 1 ? '' : 's');
                    $client = $sub->client?->business_name ?: 'Cliente';
                    Notify::toPermission(
                        ['finances.manage', 'finances.view', 'dashboard.view'],
                        'expiry',
                        "Suscripción {$sub->service_name}: {$label}",
                        "{$client} · S/ ".number_format((float) $sub->amount, 2),
                        '/admin/finances/billing',
                        ['subscriptionId' => $sub->id, 'days' => $days]
                    );
                    $created++;
                });
        }

        $this->info("Alertas generadas: {$created}");

        return self::SUCCESS;
    }
}
