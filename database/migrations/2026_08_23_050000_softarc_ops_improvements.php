<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->foreignId('converted_client_id')
                ->nullable()
                ->after('notes')
                ->constrained('clients')
                ->nullOnDelete();
        });

        Schema::table('support_tickets', function (Blueprint $table) {
            $table->text('description')->nullable()->after('subject');
            $table->text('internal_notes')->nullable()->after('description');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->foreignId('domain_id')
                ->nullable()
                ->after('client_id')
                ->constrained('domains')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('domain_id');
        });

        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropColumn(['description', 'internal_notes']);
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('converted_client_id');
        });
    }
};
