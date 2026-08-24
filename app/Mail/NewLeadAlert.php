<?php

namespace App\Mail;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewLeadAlert extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Lead $lead) {}

    public function envelope(): Envelope
    {
        $company = $this->lead->company_name ?: 'Sin empresa';

        return new Envelope(
            subject: 'Nuevo prospecto SoftArc: '.$company,
        );
    }

    public function content(): Content
    {
        $crmUrl = rtrim((string) config('app.url'), '/').'/admin/crm';

        return new Content(
            htmlString: $this->buildHtml($crmUrl),
        );
    }

    private function buildHtml(string $crmUrl): string
    {
        $lead = $this->lead;
        $rows = [
            'Contacto' => $lead->contact_name,
            'Empresa' => $lead->company_name,
            'Teléfono / WhatsApp' => $lead->phone ?: '—',
            'Email' => $lead->email ?: '—',
            'Servicio de interés' => $lead->service_of_interest ?: '—',
            'Notas' => $lead->notes ?: '—',
        ];

        $bodyRows = '';
        foreach ($rows as $label => $value) {
            $bodyRows .= '<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;width:160px;">'
                .e($label)
                .'</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;">'
                .nl2br(e((string) $value))
                .'</td></tr>';
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f8fafc;font-family:Segoe UI,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:#2563eb;color:#fff;padding:16px 20px;font-size:16px;font-weight:700;">
      Nuevo prospecto en SoftArc
    </div>
    <div style="padding:8px 8px 20px;">
      <table style="width:100%;border-collapse:collapse;">{$bodyRows}</table>
      <div style="padding:16px 12px 0;">
        <a href="{$crmUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:13px;font-weight:600;">
          Abrir Prospectos
        </a>
      </div>
    </div>
  </div>
</body>
</html>
HTML;
    }
}
