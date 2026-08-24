<?php

namespace App\Support;

use App\Models\CompanySetting;
use App\Models\Transaction;

class BillingDocuments
{
    /** Series internas de práctica (sin valor tributario). */
    public const SERIES_PRACTICE = [
        'Recibo' => 'RPR',
        'Boleta' => 'BPR',
        'Factura' => 'FPR',
    ];

    /** Series listas para cuando el RUC esté activo (aún sin envío SUNAT). */
    public const SERIES_OFFICIAL = [
        'Recibo' => 'R001',
        'Boleta' => 'B001',
        'Factura' => 'F001',
    ];

    public static function defaultEmissionMode(): string
    {
        $data = CompanySetting::query()->first()?->data ?? [];
        $mode = $data['billingEmissionMode'] ?? 'Prueba';

        return in_array($mode, ['Prueba', 'Oficial'], true) ? $mode : 'Prueba';
    }

    public static function nextNumber(string $documentType, string $emissionMode): string
    {
        $type = in_array($documentType, ['Recibo', 'Boleta', 'Factura'], true) ? $documentType : 'Recibo';
        $mode = $emissionMode === 'Oficial' ? 'Oficial' : 'Prueba';
        $series = $mode === 'Oficial'
            ? (self::SERIES_OFFICIAL[$type] ?? 'R001')
            : (self::SERIES_PRACTICE[$type] ?? 'RPR');

        $last = Transaction::query()
            ->where('invoice_number', 'like', $series.'-%')
            ->orderByDesc('id')
            ->value('invoice_number');

        $next = 1;
        if (is_string($last) && preg_match('/-(\d+)$/', $last, $m)) {
            $next = ((int) $m[1]) + 1;
        }

        return sprintf('%s-%05d', $series, $next);
    }

    public static function nextProformaNumber(): string
    {
        $series = 'PRF';
        $last = \App\Models\Proforma::query()
            ->where('number', 'like', $series.'-%')
            ->orderByDesc('id')
            ->value('number');

        $next = 1;
        if (is_string($last) && preg_match('/-(\d+)$/', $last, $m)) {
            $next = ((int) $m[1]) + 1;
        }

        return sprintf('%s-%05d', $series, $next);
    }
}
