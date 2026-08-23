<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('providers', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('type')->default('both'); // hosting | domain | both
            $table->string('website_url')->nullable();
            $table->string('panel_url')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $names = collect();

        if (Schema::hasTable('servers')) {
            $names = $names->merge(
                DB::table('servers')->whereNotNull('provider')->where('provider', '!=', '')->pluck('provider')
            );
        }

        if (Schema::hasTable('domains')) {
            $names = $names->merge(
                DB::table('domains')->whereNotNull('provider')->where('provider', '!=', '')->pluck('provider')
            );
        }

        $now = now();
        foreach ($names->map(fn ($n) => trim((string) $n))->filter()->unique()->values() as $name) {
            DB::table('providers')->insert([
                'name' => $name,
                'type' => 'both',
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('providers');
    }
};
