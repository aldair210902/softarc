<?php

namespace App\Console\Commands;

use App\Support\AuditRetention;
use Illuminate\Console\Command;

class PruneAuditLogs extends Command
{
    protected $signature = 'audit:prune {--dry-run : Solo muestra la política actual}';

    protected $description = 'Elimina logs de auditoría antiguos según la política de retención';

    public function handle(): int
    {
        $settings = AuditRetention::settings();
        $this->info("Retención: {$settings['retentionDays']} días · Tope: {$settings['maxRows']} · Conservar críticos: ".($settings['keepCritical'] ? 'sí' : 'no'));

        if ($this->option('dry-run')) {
            $this->comment('Dry-run: no se borró nada.');

            return self::SUCCESS;
        }

        $result = AuditRetention::prune();
        $this->info("Eliminados por antigüedad: {$result['deletedByAge']}");
        $this->info("Eliminados por tope: {$result['deletedByCap']}");
        $this->info("Restantes: {$result['remaining']}");

        return self::SUCCESS;
    }
}
