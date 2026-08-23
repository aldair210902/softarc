<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->json('data');
            $table->timestamps();
        });

        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('contact_name');
            $table->string('company_name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('service_of_interest')->nullable();
            $table->string('status')->default('Nuevo Prospecto');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('business_name');
            $table->string('document_number');
            $table->string('contact_name');
            $table->string('phone')->nullable();
            $table->string('billing_email')->nullable();
            $table->string('status')->default('Activo');
            $table->timestamps();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('service_name');
            $table->decimal('amount', 12, 2);
            $table->string('frequency')->default('Mensual');
            $table->date('start_date');
            $table->date('next_payment_date');
            $table->string('status')->default('Al Día');
            $table->timestamps();
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->string('invoice_number')->nullable();
            $table->string('concept');
            $table->decimal('amount_paid', 12, 2);
            $table->string('payment_method');
            $table->string('operation_code')->nullable();
            $table->date('date_received');
            $table->string('status')->default('Pagado');
            $table->timestamps();
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('provider');
            $table->string('concept');
            $table->string('category');
            $table->string('frequency')->default('Mensual');
            $table->decimal('amount', 12, 2);
            $table->date('date');
            $table->string('status')->default('Pendiente');
            $table->timestamps();
        });

        Schema::create('saas_products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category');
            $table->string('status')->default('Activo');
            $table->decimal('setup_fee', 12, 2)->default(0);
            $table->decimal('monthly_fee', 12, 2)->default(0);
            $table->unsignedInteger('active_clients')->default(0);
            $table->json('tech_stack')->nullable();
            $table->string('icon_name')->nullable();
            $table->json('image_urls')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saas_products');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('clients');
        Schema::dropIfExists('leads');
        Schema::dropIfExists('company_settings');
    }
};
