<?php

namespace App\Support;

use App\Models\CompanySetting;
use App\Models\Proforma;
use App\Models\Transaction;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class BillingPdf
{
    /**
     * @return array<string, mixed>
     */
    public static function company(): array
    {
        $data = CompanySetting::query()->first()?->data ?? [];

        return [
            'legalName' => $data['legalName'] ?? 'Software Architec',
            'commercialName' => $data['commercialName'] ?? 'Software Architec',
            'ruc' => $data['ruc'] ?? '',
            'address' => $data['address'] ?? '',
            'city' => $data['city'] ?? '',
            'country' => $data['country'] ?? '',
            'salesPhone' => $data['salesPhone'] ?? '',
            'salesEmail' => $data['salesEmail'] ?? '',
            'currencySymbol' => $data['currencySymbol'] ?? 'S/',
        ];
    }

    public static function transaction(Transaction $transaction): Response
    {
        $transaction->loadMissing('client');
        $company = self::company();
        $isPractice = ($transaction->emission_mode ?? 'Prueba') === 'Prueba';
        $type = $transaction->document_type ?? 'Recibo';

        $pdf = Pdf::loadView('pdf.voucher', [
            'company' => $company,
            'doc' => [
                'title' => $type === 'Recibo' ? 'Comprobante de pago / Recibo' : $type,
                'number' => $transaction->invoice_number,
                'type' => $type,
                'emissionMode' => $transaction->emission_mode ?? 'Prueba',
                'isPractice' => $isPractice || $type === 'Recibo',
                'customerName' => $transaction->customer_name ?: ($transaction->client?->business_name ?? '—'),
                'customerDocument' => $transaction->customer_document ?: ($transaction->client?->document_number ?? '—'),
                'customerAddress' => $transaction->customer_address ?: '—',
                'concept' => $transaction->concept,
                'amount' => (float) $transaction->amount_paid,
                'paymentMethod' => $transaction->payment_method,
                'operationCode' => $transaction->operation_code,
                'date' => optional($transaction->date_received)->format('d/m/Y'),
                'status' => $transaction->status,
                'notes' => $transaction->notes,
            ],
        ])->setPaper('a4');

        $filename = strtolower(($transaction->invoice_number ?: 'comprobante').'.pdf');

        return $pdf->download($filename);
    }

    public static function proforma(Proforma $proforma): Response
    {
        $proforma->loadMissing('client');
        $company = self::company();

        $pdf = Pdf::loadView('pdf.proforma', [
            'company' => $company,
            'doc' => [
                'number' => $proforma->number,
                'customerName' => $proforma->customer_name ?: ($proforma->client?->business_name ?? '—'),
                'customerDocument' => $proforma->customer_document ?: ($proforma->client?->document_number ?? '—'),
                'customerAddress' => $proforma->customer_address ?: '—',
                'concept' => $proforma->concept,
                'amount' => (float) $proforma->amount,
                'currency' => $proforma->currency_symbol ?: ($company['currencySymbol'] ?? 'S/'),
                'issueDate' => optional($proforma->issue_date)->format('d/m/Y'),
                'validUntil' => optional($proforma->valid_until)->format('d/m/Y'),
                'status' => $proforma->status,
                'notes' => $proforma->notes,
            ],
        ])->setPaper('a4');

        return $pdf->download(strtolower($proforma->number).'.pdf');
    }
}
