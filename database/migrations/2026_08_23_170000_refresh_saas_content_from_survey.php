<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $content = [
            'badge' => 'Software Architec · Sistemas web',
            'title' => 'Software web para',
            'titleHighlight' => 'tu empresa',
            'subtitle' => 'Desarrollamos y entregamos sistemas web: puedes alquilarlos, comprarlos o pedirlos a la medida. También páginas, plataformas, dominios y hosting. Te capacitamos para que tú (o tu equipo) operen el sistema.',
            'featured' => [
                'title' => 'Cómo puedes contratarnos',
                'description' => 'No trabajamos con “planes genéricos” por ahora: cada proyecto se cotiza según el sistema y lo que necesitas. Estas son las modalidades habituales.',
                'bullets' => [
                    'Alquiler / suscripción: usas el sistema mientras pagas el servicio (ideal si no quieres inversión grande al inicio)',
                    'Venta (pago único): adquieres el software según acuerdo y condiciones de entrega',
                    'A la medida: partimos de tu proceso si ningún sistema base te alcanza',
                    'Páginas web, blogs o plataformas + dominios y hosting (reventa con soporte de puesta en marcha)',
                ],
            ],
            'showBoxDemo' => false,
            'modules' => [
                [
                    'title' => 'Tienda online y pedidos',
                    'description' => 'Catálogo, pedidos, ventas y almacenamiento. Ideal si vendes por web o WhatsApp.',
                ],
                [
                    'title' => 'Gestión / ERP ligero',
                    'description' => 'Productos, pedidos, clientes y operación diaria — como los sistemas que ya hemos entregado a empresas.',
                ],
                [
                    'title' => 'Gestión de transporte / flota',
                    'description' => 'Operación de servicios de transporte (ej. mototaxis u operación similar) con control de gestión.',
                ],
                [
                    'title' => 'POS en tienda física',
                    'description' => 'Caja y ventas en local, cuando las integraciones/APIs lo permitan de forma viable.',
                ],
                [
                    'title' => 'Páginas web y plataformas',
                    'description' => 'Sitios corporativos, blogs o plataformas web a medida de tu marca.',
                ],
                [
                    'title' => 'Dominios y hosting',
                    'description' => 'Te ayudamos a tener tu sistema o web online, con proveedores y seguimiento desde Software Architec.',
                ],
            ],
            'modalities' => [
                [
                    'title' => 'Alquiler del sistema',
                    'description' => 'Pagas por usar el software (mensual u otro periodo). Incluye puesta en marcha y capacitación según lo acordado.',
                ],
                [
                    'title' => 'Compra / pago único',
                    'description' => 'Adquieres el sistema según contrato. Ideal si prefieres inversión única frente a membresía.',
                ],
                [
                    'title' => 'Proyecto a la medida',
                    'description' => 'Diseñamos y programamos según tus procesos cuando necesitas algo exclusivo.',
                ],
                [
                    'title' => 'Web + dominio + hosting',
                    'description' => 'Presencia online y/o infraestructura para tu sistema, con precios según proveedor y el servicio SoftArc.',
                ],
            ],
            'plans' => [],
            'ctaTitle' => 'Cuéntanos qué necesitas',
            'ctaText' => 'Escríbenos por WhatsApp o el formulario. Te orientamos con capturas o una revisión del sistema que más se acerque a tu negocio — sin planes fijos por ahora.',
        ];

        DB::table('web_pages')->where('slug', 'saas')->update([
            'content' => json_encode($content, JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        //
    }
};
