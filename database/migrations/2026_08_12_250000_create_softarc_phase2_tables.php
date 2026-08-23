<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('job_title')->nullable()->after('phone');
            $table->string('role')->default('Administrador')->after('job_title');
            $table->json('permissions')->nullable()->after('role');
            $table->string('status')->default('Activo')->after('permissions');
            $table->timestamp('last_login_at')->nullable()->after('status');
        });

        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedTinyInteger('progress')->default(0);
            $table->string('status')->default('Planificación');
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->date('due_date')->nullable();
            $table->string('repo_url')->nullable();
            $table->unsignedTinyInteger('milestones_total')->default(0);
            $table->unsignedTinyInteger('milestones_done')->default(0);
            $table->timestamps();
        });

        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->string('subject');
            $table->string('client_name')->nullable();
            $table->string('system')->nullable();
            $table->string('priority')->default('Media');
            $table->string('status')->default('Pendiente');
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();
        });

        Schema::create('servers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('ip')->nullable();
            $table->string('provider')->nullable();
            $table->string('location')->nullable();
            $table->string('category')->nullable();
            $table->unsignedTinyInteger('ram_usage')->default(0);
            $table->string('ram_label')->nullable();
            $table->unsignedTinyInteger('disk_usage')->default(0);
            $table->string('disk_label')->nullable();
            $table->text('hosted_projects')->nullable();
            $table->string('ssl_status')->default('Válido');
            $table->string('node_status')->default('Online');
            $table->string('panel_url')->nullable();
            $table->timestamps();
        });

        Schema::create('domains', function (Blueprint $table) {
            $table->id();
            $table->string('domain_name');
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->string('client_name')->nullable();
            $table->string('provider')->nullable();
            $table->date('expiry_date')->nullable();
            $table->boolean('auto_renew')->default(false);
            $table->string('dns_zone')->nullable();
            $table->timestamps();
        });

        Schema::create('credentials', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('client_or_server')->nullable();
            $table->string('username')->nullable();
            $table->text('secret');
            $table->string('category')->nullable();
            $table->timestamps();
        });

        Schema::create('wiki_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedInteger('sort')->default(0);
            $table->timestamps();
        });

        Schema::create('wiki_articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wiki_category_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('author')->nullable();
            $table->json('tags')->nullable();
            $table->longText('content')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_name')->nullable();
            $table->string('ip')->nullable();
            $table->string('action');
            $table->string('module');
            $table->string('level')->default('info');
            $table->json('details')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('wiki_articles');
        Schema::dropIfExists('wiki_categories');
        Schema::dropIfExists('credentials');
        Schema::dropIfExists('domains');
        Schema::dropIfExists('servers');
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('projects');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'job_title', 'role', 'permissions', 'status', 'last_login_at']);
        });
    }
};
