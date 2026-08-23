<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('clients')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE clients MODIFY document_number VARCHAR(255) NULL');
        } elseif ($driver === 'sqlite') {
            // SQLite no refuerza NOT NULL en columnas existentes de forma fiable aquí.
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('clients')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("UPDATE clients SET document_number = '' WHERE document_number IS NULL");
            DB::statement('ALTER TABLE clients MODIFY document_number VARCHAR(255) NOT NULL');
        }
    }
};
