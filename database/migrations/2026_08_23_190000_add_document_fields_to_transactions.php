<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('document_type', 30)->default('Recibo')->after('invoice_number');
            $table->string('emission_mode', 20)->default('Prueba')->after('document_type');
            $table->string('customer_name')->nullable()->after('client_id');
            $table->string('customer_document', 30)->nullable()->after('customer_name');
            $table->string('customer_address')->nullable()->after('customer_document');
            $table->text('notes')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn([
                'document_type',
                'emission_mode',
                'customer_name',
                'customer_document',
                'customer_address',
                'notes',
            ]);
        });
    }
};
