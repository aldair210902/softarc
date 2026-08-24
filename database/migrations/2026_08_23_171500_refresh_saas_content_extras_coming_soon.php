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
            'subtitle' => 'Desarrollamos y entregamos sistemas web: alquiler con servicio mensual, compra (pago único) o a la medida. También páginas, plataformas, dominios y hosting. En alquiler, el hosting/dominio va incluido en el servicio porque el sistema necesita dónde vivir.',
            'featured' => [
                'title' => 'Cómo puedes contratarnos',
                'description' => 'Sin planes fijos en la web: cotizamos según el sistema y el alcance. La diferencia clave es alquiler (servicio continuo) vs compra (entrega única).',
                'bullets' => [
                    'Alquiler / suscripción: pagas mensualmente. Incluye uso del sistema, hosting/dominio necesarios, actualizaciones, backups y mantenimiento mientras el servicio esté activo.',
                    'Compra (pago único): se entrega el software con documentos, capacitación una vez, manual y/o video, y acta de entrega firmada. No incluye soporte ni mantenimiento continuo después de la entrega.',
                    'A la medida: partimos de tu proceso si ningún sistema base te alcanza.',
                    'Páginas web, blogs o plataformas + dominios y hosting (reventa con puesta en marcha).',
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
                    'description' => 'Productos, pedidos, clientes y operación diaria — alineado a sistemas que ya hemos entregado.',
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
                    'description' => 'Infraestructura para tu sistema o web. En alquiler del software, dominio/hosting forman parte del servicio (sin dónde alojarlo no hay sistema).',
                ],
            ],
            'modalities' => [
                [
                    'title' => 'Alquiler del sistema',
                    'description' => 'Servicio mensual: usas el software mientras pagas. Incluye hosting/dominio necesarios, mantenimiento, actualizaciones y backups. Capacitación según lo acordado.',
                ],
                [
                    'title' => 'Compra / pago único',
                    'description' => 'Entrega única: instalación y capacitación una vez, manual y/o video, documentos y acta firmada de conformidad. Después de la entrega no aplica soporte ni mantenimiento continuo.',
                ],
                [
                    'title' => 'Proyecto a la medida',
                    'description' => 'Diseñamos y programamos según tus procesos cuando necesitas algo exclusivo. Se cotiza aparte.',
                ],
                [
                    'title' => 'Web + dominio + hosting',
                    'description' => 'Presencia online y/o infraestructura. Precios según proveedor y el servicio SoftArc.',
                ],
            ],
            'extras' => [
                [
                    'title' => 'Marca del cliente (white-label)',
                    'description' => 'El sistema con tu logo y marca, no la de Software Architec.',
                ],
                [
                    'title' => 'Multi-sucursal y roles',
                    'description' => 'Varias sedes o puntos, con usuarios y permisos por rol.',
                ],
                [
                    'title' => 'Reportes y dashboards',
                    'description' => 'Ventas, stock, cobros u otros indicadores que necesites ver de un vistazo.',
                ],
                [
                    'title' => 'App móvil (APK)',
                    'description' => 'Si lo necesitas, podemos limitar el alcance a APK para Android o iPhone según lo acordado.',
                ],
                [
                    'title' => 'Automatizaciones WhatsApp / correo',
                    'description' => 'Avisos de pedidos, recordatorios u otros flujos — solo si lo pides en la cotización.',
                ],
                [
                    'title' => 'Migración de datos',
                    'description' => 'Pasar información desde Excel u otro sistema — servicio aparte si lo requieres.',
                ],
                [
                    'title' => 'Facturación / Sunat',
                    'description' => 'Integraciones de boletas u otras APIs solo cuando existan opciones viables y gratuitas (o acordadas).',
                ],
                [
                    'title' => 'Contrato y comprobantes',
                    'description' => 'Plantillas de contrato o facturación cuando el cliente lo solicite y las herramientas/APIs lo permitan.',
                ],
            ],
            'comingSoon' => [
                ['title' => 'Academias', 'description' => 'Gestión de alumnos, horarios y pagos.'],
                ['title' => 'Clubes de fútbol', 'description' => 'Planteles, torneos y administración del club.'],
                ['title' => 'Barberías', 'description' => 'Citas, caja y fidelización del local.'],
                ['title' => 'Colegios', 'description' => 'Operación administrativa y académica.'],
                ['title' => 'Veterinarias', 'description' => 'Pacientes, historial y atención del negocio.'],
            ],
            'plans' => [],
            'ctaTitle' => 'Cuéntanos qué necesitas',
            'ctaText' => 'Escríbenos por WhatsApp o el formulario. Te orientamos con capturas del tipo de sistema (tienda, flota, ERP, etc.) — sin demos interactivas ni precios fijos por ahora.',
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
