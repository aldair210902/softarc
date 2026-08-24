<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reseller_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->nullable()->constrained('providers')->nullOnDelete();
            $table->string('name');
            $table->string('type')->default('hosting'); // hosting|domain|bundle
            $table->string('provider_plan_name')->nullable();
            $table->decimal('cost_price', 12, 2)->default(0);
            $table->decimal('sell_price', 12, 2)->default(0);
            $table->string('billing_cycle')->default('Anual'); // Mensual|Anual|Bienal|Único
            $table->json('features')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(true);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('client_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('reseller_plan_id')->nullable()->constrained('reseller_plans')->nullOnDelete();
            $table->string('service_label');
            $table->string('type')->default('hosting');
            $table->string('domain_name')->nullable();
            $table->decimal('cost_price', 12, 2)->default(0);
            $table->decimal('sell_price', 12, 2)->default(0);
            $table->string('billing_cycle')->default('Anual');
            $table->string('status')->default('Pendiente'); // Pendiente|Activo|Suspendido|Cancelado|Vencido
            $table->date('start_date')->nullable();
            $table->date('renew_date')->nullable();
            $table->foreignId('domain_id')->nullable()->constrained('domains')->nullOnDelete();
            $table->foreignId('server_id')->nullable()->constrained('servers')->nullOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->nullOnDelete();
            $table->string('provider_name')->nullable();
            $table->text('delivery_notes')->nullable();
            $table->text('internal_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_services');
        Schema::dropIfExists('reseller_plans');
    }
};
