<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111; margin: 28px; }
    .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 18px; }
    .brand { font-size: 18px; font-weight: bold; color: #1e3a8a; }
    .muted { color: #555; font-size: 11px; }
    .badge { display: inline-block; padding: 4px 8px; background: #fef3c7; color: #92400e; font-weight: bold; font-size: 10px; border: 1px solid #f59e0b; }
    .title { font-size: 16px; font-weight: bold; margin: 16px 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f1f5f9; }
    .amount { font-size: 18px; font-weight: bold; }
    .footer { margin-top: 28px; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">{{ $company['commercialName'] }}</div>
    <div class="muted">{{ $company['legalName'] }} @if($company['ruc']) · RUC {{ $company['ruc'] }} @endif</div>
    <div class="muted">{{ $company['address'] }} {{ $company['city'] }} {{ $company['country'] }}</div>
    <div class="muted">{{ $company['salesPhone'] }} {{ $company['salesEmail'] }}</div>
  </div>

  @if(!empty($doc['isPractice']))
    <div class="badge">DOCUMENTO INTERNO / PRÁCTICA — SIN VALOR TRIBUTARIO (no es boleta ni factura SUNAT)</div>
  @endif

  <div class="title">{{ $doc['title'] }} Nº {{ $doc['number'] }}</div>
  <div class="muted">Fecha: {{ $doc['date'] }} · Estado: {{ $doc['status'] }} · Modo: {{ $doc['emissionMode'] }}</div>

  <p><strong>Cliente:</strong> {{ $doc['customerName'] }}<br>
  <strong>Documento:</strong> {{ $doc['customerDocument'] }}<br>
  <strong>Dirección:</strong> {{ $doc['customerAddress'] }}</p>

  <table>
    <thead>
      <tr>
        <th>Concepto</th>
        <th style="width:120px">Importe</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{{ $doc['concept'] }}</td>
        <td class="amount">{{ $company['currencySymbol'] }} {{ number_format($doc['amount'], 2) }}</td>
      </tr>
    </tbody>
  </table>

  <p style="margin-top:14px">
    <strong>Método de pago:</strong> {{ $doc['paymentMethod'] }}<br>
    @if(!empty($doc['operationCode']))
      <strong>Código de operación:</strong> {{ $doc['operationCode'] }}<br>
    @endif
    @if(!empty($doc['notes']))
      <strong>Notas:</strong> {{ $doc['notes'] }}
    @endif
  </p>

  <div class="footer">
    Generado por SoftArc / {{ $company['commercialName'] }}.
    @if(!empty($doc['isPractice']))
      Este documento solo registra el cobro en el sistema; no sustituye un comprobante electrónico SUNAT.
    @endif
  </div>
</body>
</html>
