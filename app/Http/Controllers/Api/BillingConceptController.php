<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Proforma;
use App\Models\ResellerPlan;
use App\Models\Subscription;
use App\Models\Transaction;
use Illuminate\Http\Request;

class BillingConceptController extends Controller
{
    /** Catálogo de conceptos para proformas y cobranzas (seleccionables + importe sugerido). */
    public function index(Request $request)
    {
        $options = [];

        $push = function (string $label, ?float $amount = null, string $source = 'sugerido') use (&$options) {
            $label = trim($label);
            if ($label === '') {
                return;
            }
            $key = mb_strtolower($label);
            if (isset($options[$key])) {
                if ($options[$key]['amount'] === null && $amount !== null) {
                    $options[$key]['amount'] = $amount;
                }

                return;
            }
            $options[$key] = [
                'label' => $label,
                'amount' => $amount,
                'source' => $source,
            ];
        };

        foreach ([
            'Alquiler de sistema web (mensual)',
            'Alquiler de sistema + hosting (mensual)',
            'Venta de software (pago único)',
            'Desarrollo a la medida',
            'Puesta en marcha / capacitación',
            'Página web / landing',
            'Hosting',
            'Dominio (registro o renovación)',
            'Mantenimiento mensual',
            'Migración de datos',
        ] as $label) {
            $push($label, null, 'sugerido');
        }

        ResellerPlan::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['name', 'sell_price', 'type'])
            ->each(function (ResellerPlan $plan) use ($push) {
                $prefix = match ($plan->type) {
                    'domain' => 'Dominio',
                    'hosting' => 'Hosting',
                    default => 'Plan',
                };
                $push($prefix.': '.$plan->name, (float) $plan->sell_price, 'plan');
            });

        Subscription::query()
            ->select('service_name')
            ->selectRaw('MAX(amount) as amount')
            ->groupBy('service_name')
            ->orderBy('service_name')
            ->get()
            ->each(function ($row) use ($push) {
                $push((string) $row->service_name, $row->amount !== null ? (float) $row->amount : null, 'suscripcion');
            });

        Proforma::query()
            ->select('concept')
            ->selectRaw('MAX(amount) as amount')
            ->groupBy('concept')
            ->orderBy('concept')
            ->limit(80)
            ->get()
            ->each(function ($row) use ($push) {
                $push((string) $row->concept, $row->amount !== null ? (float) $row->amount : null, 'proforma');
            });

        Transaction::query()
            ->select('concept')
            ->selectRaw('MAX(amount_paid) as amount')
            ->groupBy('concept')
            ->orderBy('concept')
            ->limit(80)
            ->get()
            ->each(function ($row) use ($push) {
                $push((string) $row->concept, $row->amount !== null ? (float) $row->amount : null, 'cobro');
            });

        $list = array_values($options);
        usort($list, fn ($a, $b) => strcasecmp($a['label'], $b['label']));

        return response()->json($list);
    }
}
