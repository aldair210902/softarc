<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (! Schema::hasColumn('leads', 'meta')) {
                $table->json('meta')->nullable()->after('notes');
            }
        });

        $exists = DB::table('web_pages')->where('slug', 'contact-form')->exists();
        if (! $exists) {
            DB::table('web_pages')->insert([
                'slug' => 'contact-form',
                'title' => 'Formulario de contacto',
                'content' => json_encode(['_seed' => true], JSON_UNESCAPED_UNICODE),
                'is_published' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            DB::table('web_pages')->where('slug', 'contact-form')->update([
                'is_published' => true,
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (Schema::hasColumn('leads', 'meta')) {
                $table->dropColumn('meta');
            }
        });
    }
};
