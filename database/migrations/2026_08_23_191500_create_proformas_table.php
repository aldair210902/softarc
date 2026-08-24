<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proformas', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('customer_name')->nullable();
            $table->string('customer_document', 30)->nullable();
            $table->string('customer_address')->nullable();
            $table->string('concept');
            $table->decimal('amount', 12, 2);
            $table->string('currency_symbol', 10)->default('S/');
            $table->date('issue_date');
            $table->date('valid_until')->nullable();
            $table->string('status', 30)->default('Borrador'); // Borrador, Enviada, Aceptada, Anulada
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proformas');
    }
};
