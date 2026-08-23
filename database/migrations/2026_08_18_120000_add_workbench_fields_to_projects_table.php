<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('local_path_pc', 500)->nullable()->after('repo_url');
            $table->string('local_path_laptop', 500)->nullable()->after('local_path_pc');
            $table->string('last_sync_device', 50)->nullable()->after('local_path_laptop');
            $table->timestamp('last_sync_at')->nullable()->after('last_sync_device');
            $table->text('sync_note')->nullable()->after('last_sync_at');
            $table->text('db_note')->nullable()->after('sync_note');
            $table->date('last_db_touch_at')->nullable()->after('db_note');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'local_path_pc',
                'local_path_laptop',
                'last_sync_device',
                'last_sync_at',
                'sync_note',
                'db_note',
                'last_db_touch_at',
            ]);
        });
    }
};
