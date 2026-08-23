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
            $table->foreignId('client_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->foreignId('domain_id')->nullable()->after('client_id')->constrained()->nullOnDelete();
            $table->index(['client_id', 'domain_id']);
        });

        $this->backfillLinks();
    }

    public function down(): void
    {
        Schema::table('credentials', function (Blueprint $table) {
            $table->dropConstrainedForeignId('domain_id');
            $table->dropConstrainedForeignId('client_id');
        });
    }

    private function backfillLinks(): void
    {
        $domains = DB::table('domains')->select('id', 'domain_name', 'client_id')->get();
        $clients = DB::table('clients')->select('id', 'business_name')->get();

        $credentials = DB::table('credentials')->select('id', 'name', 'client_or_server')->get();

        foreach ($credentials as $cred) {
            $haystack = Str::lower(trim(($cred->name ?? '').' '.($cred->client_or_server ?? '')));
            if ($haystack === '') {
                continue;
            }

            $domainId = null;
            $clientId = null;

            foreach ($domains as $domain) {
                $needle = Str::lower(trim((string) $domain->domain_name));
                if ($needle !== '' && str_contains($haystack, $needle)) {
                    $domainId = $domain->id;
                    $clientId = $domain->client_id;
                    break;
                }
            }

            if (! $clientId) {
                foreach ($clients as $client) {
                    $needle = Str::lower(trim((string) $client->business_name));
                    if ($needle !== '' && str_contains($haystack, $needle)) {
                        $clientId = $client->id;
                        break;
                    }
                }
            }

            if ($domainId || $clientId) {
                DB::table('credentials')->where('id', $cred->id)->update([
                    'domain_id' => $domainId,
                    'client_id' => $clientId,
                ]);
            }
        }
    }
};
