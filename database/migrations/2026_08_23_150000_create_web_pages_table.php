<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('web_pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title')->nullable();
            $table->json('content');
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        $now = now();

        DB::table('web_pages')->insert([
            [
                'slug' => 'home-pillars',
                'title' => 'Pilares Home',
                'content' => json_encode([
                    'pillars' => [
                        [
                            'key' => 'saas',
                            'title' => '1. Sistemas SaaS',
                            'description' => 'Software por suscripción listo para potenciar tu empresa de forma inmediata.',
                            'bullets' => [
                                'Pago mensual (MRR).',
                                'Multi-usuario y escalable.',
                                'Sin instalación (100% Cloud).',
                            ],
                            'ctaLabel' => 'Ver productos',
                            'ctaPath' => '/servicios/saas',
                            'icon' => 'Cloud',
                        ],
                        [
                            'key' => 'medida',
                            'title' => '2. Desarrollo a la Medida',
                            'description' => 'Software Factory exclusivo creado según los flujos únicos de tu organización.',
                            'bullets' => [
                                'Código propio y exclusivo.',
                                'Arquitectura altamente escalable.',
                                'Integración API con terceros.',
                            ],
                            'ctaLabel' => 'Cotizar Proyecto',
                            'ctaPath' => '/servicios/a-la-medida',
                            'icon' => 'Code2',
                        ],
                        [
                            'key' => 'web',
                            'title' => '3. Páginas Web & Blogs',
                            'description' => 'Sitios de alta conversión, blogs SEO y presencia digital con velocidad extrema.',
                            'bullets' => [
                                'Landing pages de conversión.',
                                'Webs corporativas administrables.',
                                'Arquitectura SEO on-page.',
                            ],
                            'ctaLabel' => 'Ver servicios web',
                            'ctaPath' => '/servicios/paginas-web-blogs',
                            'icon' => 'Globe',
                        ],
                        [
                            'key' => 'infra',
                            'title' => '4. Hosting & Infra',
                            'description' => 'Gestión técnica continua e infraestructura Cloud de alto rendimiento.',
                            'bullets' => [
                                'Mantenimiento continuo de VPS.',
                                'Respaldos diarios S3.',
                                'Monitoreo de Uptime 24/7.',
                            ],
                            'ctaLabel' => 'Ver Planes',
                            'ctaPath' => '/servicios/infraestructura-soporte',
                            'icon' => 'Server',
                        ],
                    ],
                ], JSON_UNESCAPED_UNICODE),
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'saas',
                'title' => 'Página SaaS',
                'content' => json_encode([
                    'badge' => 'Software as a Service (SaaS)',
                    'title' => 'Plataformas SaaS listas para',
                    'titleHighlight' => 'escalar tus ventas',
                    'subtitle' => 'Elimina el alto costo de desarrollo inicial. Nuestras plataformas modulares están optimizadas para la conversión de clientes, control de inventario y cobros automatizados.',
                    'featured' => [
                        'title' => 'SoftArc Commerce: E-commerce Modular SoftArc',
                        'description' => 'Diseñado para marcas de moda, regalos, accesorios y productos empaquetados. SoftArc Commerce es una arquitectura ultraligera con checkout local y herramientas comerciales nativas — sin comisiones ocultas ni plugins pesados.',
                        'bullets' => [
                            'Catálogo dinámico con variantes, stock y notificaciones WhatsApp',
                            'Checkout nativo Yape, Plin, BCP y pasarelas con tarjeta',
                            'Auditoría IP, métricas de finanzas y margen bruto por producto',
                        ],
                    ],
                    'showBoxDemo' => false,
                    'modules' => [
                        [
                            'title' => 'POS & Facturación',
                            'description' => 'Punto de venta web para tiendas físicas con lector de código de barras, control de caja y emisión de comprobantes.',
                        ],
                        [
                            'title' => 'Menú QR & Comandas',
                            'description' => 'Carta interactiva para cafeterías y restaurantes: pedidos a cocina y cuentas por mesa.',
                        ],
                        [
                            'title' => 'Citas & Reservas',
                            'description' => 'Agenda inteligente para consultorios, spas y asesorías con recordatorios por WhatsApp.',
                        ],
                        [
                            'title' => 'Inventario Multisede',
                            'description' => 'Control de almacenes, lotes y transferencias sincronizadas en tiempo real.',
                        ],
                        [
                            'title' => 'CRM Comercial',
                            'description' => 'Pipeline de prospectos, seguimiento de recompras y cupones por segmento.',
                        ],
                        [
                            'title' => 'Reportes & API',
                            'description' => 'Dashboards operativos, webhooks y API REST para integrar ERP o BI externos.',
                        ],
                    ],
                    'plans' => [
                        [
                            'name' => 'SoftArc Starter',
                            'target' => 'Emprendedores y marcas en lanzamiento',
                            'monthlyPrice' => 120,
                            'setupFee' => 'S/ 250 (Pago único)',
                            'features' => [
                                'Catálogo digital dinámico hasta 250 productos',
                                'Checkout transparente con Yape, Plin y BCP',
                                'Notificaciones de pedidos por WhatsApp',
                                'Panel administrativo de stock básico',
                                'Certificado SSL + subdominio o dominio propio',
                                'Soporte técnico por tickets (Lunes a Viernes)',
                            ],
                            'highlight' => false,
                        ],
                        [
                            'name' => 'SoftArc Pro',
                            'target' => 'E-commerce en crecimiento con alta rotación',
                            'monthlyPrice' => 220,
                            'setupFee' => 'S/ 450 (Puesta en marcha y carga inicial)',
                            'features' => [
                                'Productos y variantes ilimitadas (tallas/colores)',
                                'Integración con pasarelas de tarjeta (Culqi / MercadoPago)',
                                'Gestión de almacenes multisede e inventario por lotes',
                                'Control de clientes, historial de recompras y cupones',
                                'Reporte de finanzas, márgenes brutos y auditoría IP',
                                'Soporte prioritario 24/7 y copias de seguridad diarias',
                            ],
                            'highlight' => true,
                        ],
                        [
                            'name' => 'SoftArc Suite',
                            'target' => 'Cadenas, retail y empresas multicanal',
                            'monthlyPrice' => 390,
                            'setupFee' => 'S/ 750 (Parametrización completa)',
                            'features' => [
                                'Todo lo de SoftArc Pro',
                                'Módulo POS para sincronizar puntos de venta físicos',
                                'Integración con Facturación Electrónica SUNAT (UBL 2.1)',
                                'Módulo de Menú QR / Comandas para locales gastronómicos',
                                'Acceso a Webhooks y API REST para integraciones ERP',
                                'Servidor VPS dedicado optimizado para alto tráfico',
                                'SLA 99.95% garantizado con Gerente de Cuenta técnico',
                            ],
                            'highlight' => false,
                        ],
                    ],
                    'ctaTitle' => '¿Necesitas una demostración guiada de SoftArc Commerce?',
                    'ctaText' => 'Un especialista te mostrará el panel administrativo en vivo y cómo configurar tus pasarelas locales.',
                ], JSON_UNESCAPED_UNICODE),
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'a-medida',
                'title' => 'Desarrollo a la medida',
                'content' => json_encode([
                    'title' => 'Desarrollo a la Medida',
                    'subtitle' => 'Software Factory exclusivo según los flujos de tu organización.',
                ], JSON_UNESCAPED_UNICODE),
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'web',
                'title' => 'Páginas web & blogs',
                'content' => json_encode([
                    'title' => 'Páginas Web & Blogs',
                    'subtitle' => 'Sitios de alta conversión y presencia digital con velocidad extrema.',
                ], JSON_UNESCAPED_UNICODE),
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'infra',
                'title' => 'Infraestructura & soporte',
                'content' => json_encode([
                    'title' => 'Hosting & Infraestructura',
                    'subtitle' => 'Gestión técnica continua e infraestructura Cloud de alto rendimiento.',
                ], JSON_UNESCAPED_UNICODE),
                'is_published' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('web_pages');
    }
};
