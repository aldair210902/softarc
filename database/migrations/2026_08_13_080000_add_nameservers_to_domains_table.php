<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->string('nameserver1')->nullable()->after('dns_zone');
            $table->string('nameserver1_ip')->nullable()->after('nameserver1');
            $table->string('nameserver2')->nullable()->after('nameserver1_ip');
            $table->string('nameserver2_ip')->nullable()->after('nameserver2');
        });
    }

    public function down(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->dropColumn(['nameserver1', 'nameserver1_ip', 'nameserver2', 'nameserver2_ip']);
        });
    }
};
