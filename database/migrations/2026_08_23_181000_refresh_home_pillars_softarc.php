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
                    'title' => '1. Sistemas web',
                    'description' => 'Software para alquilar o comprar: tienda, gestión/ERP, flota y más. Cotizamos según tu necesidad.',
                    'bullets' => [
                        'Alquiler mensual o pago único.',
                        'Hosting incluido en alquiler.',
                        'Capacitación para que operes tú.',
                    ],
                    'ctaLabel' => 'Ver sistemas',
                    'ctaPath' => '/servicios/saas',
                    'icon' => 'Cloud',
                ],
                [
                    'key' => 'medida',
                    'title' => '2. Desarrollo a la Medida',
                    'description' => 'Software creado según los flujos de tu organización cuando un sistema estándar no alcanza.',
                    'bullets' => [
                        'Alcance y contrato claros.',
                        'Entrega con documentos y capacitación.',
                        'Extras solo si los pides.',
                    ],
                    'ctaLabel' => 'Cotizar proyecto',
                    'ctaPath' => '/servicios/a-la-medida',
                    'icon' => 'Code2',
                ],
                [
                    'key' => 'web',
                    'title' => '3. Páginas Web & Blogs',
                    'description' => 'Landing, web corporativa o blog. Cotizamos según secciones y si incluye dominio/hosting.',
                    'bullets' => [
                        'Diseño adaptable a celular.',
                        'Contacto por WhatsApp.',
                        'SEO básico según alcance.',
                    ],
                    'ctaLabel' => 'Ver servicios web',
                    'ctaPath' => '/servicios/paginas-web-blogs',
                    'icon' => 'Globe',
                ],
                [
                    'key' => 'infra',
                    'title' => '4. Dominios & Hosting',
                    'description' => 'Infraestructura para tu web o sistema, con seguimiento SoftArc.',
                    'bullets' => [
                        'Reventa según proveedor.',
                        'En alquiler de software, hosting incluido.',
                        'Puesta en marcha acordada.',
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
