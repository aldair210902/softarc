<?php

namespace App\Support;

use App\Mail\NewLeadAlert;
use App\Models\CompanySetting;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class LeadAlerter
{
    /**
     * Aviso in-app + email a ventas / usuarios CRM.
     */
    public static function notifyNew(Lead $lead, ?int $exceptUserId = null): void
    {
        $bodyParts = array_filter([
            $lead->contact_name,
            $lead->phone,
            $lead->email,
            $lead->service_of_interest,
        ]);

        Notify::toPermission(
            ['crm.manage', 'crm.view'],
            'lead',
            'Nuevo prospecto: '.$lead->company_name,
            implode(' · ', $bodyParts) ?: null,
            '/admin/crm',
            ['leadId' => $lead->id],
            $exceptUserId
        );

        self::sendEmails($lead);
    }

    private static function sendEmails(Lead $lead): void
    {
        $emails = collect();

        $settings = CompanySetting::query()->first()?->data ?? [];
        foreach (['salesEmail', 'supportEmail'] as $key) {
            $value = trim((string) ($settings[$key] ?? ''));
            if ($value !== '' && filter_var($value, FILTER_VALIDATE_EMAIL)) {
                $emails->push(strtolower($value));
            }
        }

        User::query()
            ->where('status', 'Activo')
            ->whereNotNull('email')
            ->get()
            ->filter(fn (User $user) => $user->canAccess('crm.manage') || $user->canAccess('crm.view'))
            ->each(function (User $user) use ($emails) {
                $email = trim((string) $user->email);
                if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $emails->push(strtolower($email));
                }
            });

        $unique = $emails->unique()->values();
        if ($unique->isEmpty()) {
            return;
        }

        try {
            Mail::to($unique->all())->send(new NewLeadAlert($lead));
        } catch (\Throwable $e) {
            Log::warning('No se pudo enviar email de nuevo prospecto', [
                'lead_id' => $lead->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
