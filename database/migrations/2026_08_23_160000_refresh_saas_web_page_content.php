<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $content = [
            'badge' => 'Software por suscripción (SaaS)',
            'title' => 'Sistemas listos para',
            'titleHighlight' => 'operar y vender',
            'subtitle' => 'Software ya armado para tu negocio: tienda, inventario, cobros o gestión. Lo configuras, pagas una membresía mensual y nosotros nos encargamos de que funcione. Sin proyecto a medida desde cero.',
            'featured' => [
                'title' => 'Cómo funciona SoftArc SaaS',
                'description' => 'No vendemos la marca de un cliente: ofrecemos sistemas SoftArc por suscripción. Tú eliges el que más se acerque a tu operación; nosotros instalamos, capacitamos y damos soporte continuo.',
                'bullets' => [
                    'Puesta en marcha incluida (setup) y capacitación inicial',
                    'Membresía mensual con hosting, actualizaciones y soporte',
                    'Pagos locales (Yape, Plin, transferencias) y pasarelas cuando las necesites',
                    'Si ningún sistema te alcanza, te orientamos a desarrollo a la medida',
                ],
            ],
            'showBoxDemo' => false,
            'modules' => [
                [
                    'title' => 'Vender por internet',
                    'description' => 'Catálogo, pedidos y cobros para marcas que venden online o por WhatsApp.',
                ],
                [
                    'title' => 'Tienda física (POS)',
                    'description' => 'Caja rápida, stock y comprobantes para locales y multi-sucursal.',
                ],
                [
                    'title' => 'Restaurantes y cartas QR',
                    'description' => 'Menú digital, comandas a cocina y control de mesas.',
                ],
                [
                    'title' => 'Citas y reservas',
                    'description' => 'Agenda para consultorios, spas o asesorías con recordatorios.',
                ],
                [
                    'title' => 'Inventario y almacenes',
                    'description' => 'Control de stock, transferencias y alertas de faltantes.',
                ],
                [
                    'title' => 'Reportes y seguimiento',
                    'description' => 'Ventas, márgenes y clientes en un panel claro para decidir.',
                ],
            ],
            'plans' => [
                [
                    'name' => 'Starter',
                    'target' => 'Emprendedores y marcas que recién digitalizan',
                    'monthlyPrice' => 120,
                    'setupFee' => 'S/ 250 (único)',
                    'features' => [
                        'Un sistema SoftArc según tu giro',
                        'Hasta 250 productos o registros base',
                        'Cobros con Yape, Plin y transferencia',
                        'Notificaciones por WhatsApp',
                        'SSL y dominio o subdominio',
                        'Soporte por tickets (lun–vie)',
                    ],
                    'highlight' => false,
                ],
                [
                    'name' => 'Pro',
                    'target' => 'Negocios en crecimiento con más operación diaria',
                    'monthlyPrice' => 220,
                    'setupFee' => 'S/ 450 (puesta en marcha)',
                    'features' => [
                        'Catálogo o operación con mayor volumen',
                        'Pasarelas con tarjeta (Culqi / Mercado Pago)',
                        'Inventario y clientes más completos',
                        'Reportes de ventas y márgenes',
                        'Backups diarios',
                        'Soporte prioritario',
                    ],
                    'highlight' => true,
                ],
                [
                    'name' => 'Suite',
                    'target' => 'Cadenas, retail o varios canales a la vez',
                    'monthlyPrice' => 390,
                    'setupFee' => 'S/ 750 (parametrización)',
                    'features' => [
                        'Todo lo de Pro',
                        'POS / módulos extra según necesidad',
                        'Integraciones API cuando aplique',
                        'Infraestructura reforzada',
                        'SLA y acompañamiento técnico cercano',
                    ],
                    'highlight' => false,
                ],
            ],
            'ctaTitle' => '¿Quieres ver el sistema en vivo?',
            'ctaText' => 'Agenda una demostración: te mostramos el panel y te recomendamos el plan según tu negocio. No necesitas saber de software.',
        ];

        DB::table('web_pages')->where('slug', 'saas')->update([
            'content' => json_encode($content, JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        // Sin rollback de copy editorial.
    }
};
