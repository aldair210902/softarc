<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $content = [
            'pillars' => [
                [
                    'key' => 'saas',
                    'title' => 'Sistemas web listos',
                    'description' => 'Software ya preparado para tu negocio (tienda, gestión/ERP, flota, etc.). Lo alquilas mes a mes o lo compras una vez.',
                    'bullets' => [
                        'No lo armamos desde cero: partimos de un sistema listo.',
                        'Alquiler (hosting incluido) o compra (pago único).',
                        'Te capacitamos para que lo uses tú.',
                    ],
                    'ctaLabel' => 'Ver sistemas',
                    'ctaPath' => '/servicios/saas',
                    'icon' => 'Cloud',
                ],
                [
                    'key' => 'medida',
                    'title' => 'Desarrollo a la medida',
                    'description' => 'Cuando un sistema listo no encaja con cómo trabajas. Diseñamos y programamos el software según tu proceso.',
                    'bullets' => [
                        'Hecho a pedido: flujos, roles y reportes tuyos.',
                        'Alcance y contrato claros antes de empezar.',
                        'Entrega con capacitación y documentos.',
                    ],
                    'ctaLabel' => 'Cotizar proyecto',
                    'ctaPath' => '/servicios/a-la-medida',
                    'icon' => 'Code2',
                ],
                [
                    'key' => 'web',
                    'title' => 'Páginas web & blogs',
                    'description' => 'Tu presencia en internet: landing, web de empresa o blog. No es un sistema de gestión; es para captar clientes y mostrar tu marca.',
                    'bullets' => [
                        'Landing o web corporativa adaptable a celular.',
                        'Botones a WhatsApp y formularios de contacto.',
                        'SEO básico según el alcance acordado.',
                    ],
                    'ctaLabel' => 'Ver servicios web',
                    'ctaPath' => '/servicios/paginas-web-blogs',
                    'icon' => 'Globe',
                ],
                [
                    'key' => 'infra',
                    'title' => 'Dominios & hosting',
                    'description' => 'Que tu web o sistema esté online: dominio, hosting y puesta en marcha con seguimiento SoftArc.',
                    'bullets' => [
                        'Reventa según proveedor (Planeta, Hostinger, etc.).',
                        'En alquiler de software, el hosting suele ir incluido.',
                        'Soporte de alta y configuración inicial.',
                    ],
                    'ctaLabel' => 'Ver infraestructura',
                    'ctaPath' => '/servicios/infraestructura-soporte',
                    'icon' => 'Server',
                ],
            ],
        ];

        DB::table('web_pages')->where('slug', 'home-pillars')->update([
            'content' => json_encode($content, JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        //
    }
};
