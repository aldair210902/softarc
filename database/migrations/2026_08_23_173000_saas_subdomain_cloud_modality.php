<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $row = DB::table('web_pages')->where('slug', 'saas')->first();
        if (!$row) {
            return;
        }

        $content = json_decode($row->content ?? '{}', true) ?: [];

        $content['featured'] = [
            'title' => $content['featured']['title'] ?? 'Cómo puedes contratarnos',
            'description' => 'Sin planes fijos en la web: cotizamos según el sistema y el alcance. La diferencia clave es alquiler (servicio continuo) vs compra (entrega única).',
            'bullets' => [
                'Alquiler / suscripción: pagas mensualmente. Incluye uso del sistema, hosting necesario, actualizaciones, backups y mantenimiento mientras el servicio esté activo.',
                'Cuando un sistema se consolida (ej. un producto para clubes), el alquiler puede ser por subdominio: tuclub.producto.pe — sin comprar dominio aparte.',
                'Compra (pago único): se entrega el software con documentos, capacitación una vez, manual y/o video, y acta de entrega firmada. No incluye soporte ni mantenimiento continuo después de la entrega.',
                'A la medida o páginas web + dominios/hosting propios cuando el proyecto lo requiera.',
            ],
        ];

        $content['modalities'] = [
            [
                'title' => 'Alquiler del sistema',
                'description' => 'Servicio mensual: usas el software mientras pagas. Incluye hosting, mantenimiento, actualizaciones y backups. Capacitación según lo acordado.',
            ],
            [
                'title' => 'Alquiler en subdominio (nube SoftArc)',
                'description' => 'Cuando el producto tiene nombre propio y demanda (ej. un sistema de clubes), te damos acceso tipo tuclub.producto.pe. Ideal para arrancar rápido sin comprar dominio. Dominio propio (white-label) se cotiza aparte.',
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
                'description' => 'Presencia online y/o infraestructura dedicada. Precios según proveedor y el servicio SoftArc.',
            ],
        ];

        $content['comingSoon'] = [
            [
                'title' => 'Productos con subdominio',
                'description' => 'Sistemas con marca propia (ej. academias o clubes) accesibles como tucliente.producto.pe cuando haya demanda real.',
            ],
            ['title' => 'Academias', 'description' => 'Gestión de alumnos, horarios y pagos — candidato a producto con subdominio.'],
            ['title' => 'Clubes de fútbol', 'description' => 'Planteles, torneos y administración — ej. tuclub.pateadon.pe cuando exista el producto.'],
            ['title' => 'Barberías', 'description' => 'Citas, caja y fidelización del local.'],
            ['title' => 'Colegios', 'description' => 'Operación administrativa y académica.'],
            ['title' => 'Veterinarias', 'description' => 'Pacientes, historial y atención del negocio.'],
        ];

        // Ajuste dominio/hosting en modules si existe
        if (!empty($content['modules']) && is_array($content['modules'])) {
            foreach ($content['modules'] as &$mod) {
                if (($mod['title'] ?? '') === 'Dominios y hosting') {
                    $mod['description'] = 'En alquiler, el sistema vive en nuestra infraestructura (dominio propio o subdominio del producto). En compra o web aparte, te ayudamos con dominio/hosting según el caso.';
                }
            }
            unset($mod);
        }

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
