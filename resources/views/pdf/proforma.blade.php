<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111; margin: 28px; }
    .header { border-bottom: 2px solid #0e7490; padding-bottom: 12px; margin-bottom: 18px; }
    .brand { font-size: 18px; font-weight: bold; color: #0e7490; }
    .muted { color: #555; font-size: 11px; }
    .badge { display: inline-block; padding: 4px 8px; background: #ecfeff; color: #155e75; font-weight: bold; font-size: 10px; border: 1px solid #22d3ee; }
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
  </div>

  <div class="badge">PROFORMA — Cotización / propuesta (no es comprobante de pago ni factura)</div>

  <div class="title">Proforma Nº {{ $doc['number'] }}</div>
  <div class="muted">
    Emisión: {{ $doc['issueDate'] }}
    @if(!empty($doc['validUntil'])) · Válida hasta: {{ $doc['validUntil'] }} @endif
    · Estado: {{ $doc['status'] }}
  </div>

  <p><strong>Cliente:</strong> {{ $doc['customerName'] }}<br>
  <strong>Documento:</strong> {{ $doc['customerDocument'] }}<br>
  <strong>Dirección:</strong> {{ $doc['customerAddress'] }}</p>

  <table>
    <thead>
      <tr>
        <th>Descripción / concepto</th>
        <th style="width:120px">Importe</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{{ $doc['concept'] }}</td>
        <td class="amount">{{ $doc['currency'] }} {{ number_format($doc['amount'], 2) }}</td>
      </tr>
    </tbody>
  </table>

  @if(!empty($doc['notes']))
    <p style="margin-top:14px"><strong>Condiciones / notas:</strong> {{ $doc['notes'] }}</p>
  @endif

  <div class="footer">
    Esta proforma es una propuesta comercial. Al aceptar y pagar, se registrará el cobro en SoftArc
    (recibo interno mientras no se emitan boletas/facturas oficiales).
  </div>
</body>
</html>
