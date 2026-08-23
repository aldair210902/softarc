<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('credentials', function (Blueprint $table) {
            $table->unsignedSmallInteger('port')->nullable()->after('client_or_server');
            $table->string('encryption', 50)->nullable()->after('port');
        });

        $rows = DB::table('credentials')->select('id', 'name', 'category', 'client_or_server')->get();
        foreach ($rows as $row) {
            $isFtp = Str::contains(Str::lower(($row->name ?? '').' '.($row->category ?? '').' '.($row->client_or_server ?? '')), 'ftp');
            if (! $isFtp) {
                continue;
            }

            $host = (string) ($row->client_or_server ?? '');
            $port = 21;
            if (preg_match('/:(\d+)\s*$/', $host, $m)) {
                $port = (int) $m[1];
                $host = preg_replace('/:\d+\s*$/', '', $host) ?? $host;
            }

            DB::table('credentials')->where('id', $row->id)->update([
                'client_or_server' => trim($host) !== '' ? trim($host) : $row->client_or_server,
                'port' => $port,
                'encryption' => 'plain',
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('credentials', function (Blueprint $table) {
            $table->dropColumn(['port', 'encryption']);
        });
    }
};
