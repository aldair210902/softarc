<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('servers')) {
            return;
        }

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE servers ADD COLUMN webmail_url VARCHAR(255) NULL AFTER panel_url');
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('servers')) {
            return;
        }

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE servers DROP COLUMN webmail_url');
        }
    }
};
