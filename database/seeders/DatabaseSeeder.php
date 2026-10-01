<?php

namespace Database\Seeders;

use App\Models\CompanySetting;
use App\Models\SaasProduct;
use App\Models\User;
use App\Models\WikiArticle;
use App\Models\WikiCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Solo datos operativos mínimos: admin + configuración de empresa.
     * Sin clientes, leads, facturas ni métricas de demostración.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@softwarearchitec.pe'],
            [
                'name' => 'Aldair Flores',
                'password' => Hash::make('password'),
                'phone' => '987654321',
                'job_title' => 'Lead Software Architect',
                'role' => 'Administrador',
                'permissions' => ['all'],
                'status' => 'Activo',
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'soporte@softwarearchitec.pe'],
            [
                'name' => 'Ana Soporte',
                'password' => Hash::make('password'),
                'phone' => '987111222',
                'job_title' => 'Soporte L1',
                'role' => 'Soporte',
                'permissions' => [],
                'status' => 'Activo',
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'ventas@softwarearchitec.pe'],
            [
                'name' => 'Luis Ventas',
                'password' => Hash::make('password'),
                'phone' => '987333444',
                'job_title' => 'Ejecutivo Comercial',
                'role' => 'Ventas',
                'permissions' => [],
                'status' => 'Activo',
            ]
        );

        CompanySetting::query()->updateOrCreate(
            ['id' => 1],
            [
                'data' => [
                    'legalName' => 'Software Architec SAC',
                    'commercialName' => 'Software Architec',
                    'ruc' => '20610948215',
                    'address' => 'Av. Javier Prado Este 4200, Santiago de Surco',
                    'city' => 'Lima',
                    'country' => 'Perú',
                    'legalRepresentative' => 'Aldair Flores - Lead Software Architect',
                    'brandSlogan' => 'Sistemas listos, a medida, páginas web y hosting. Cotizamos según tu negocio.',
                    'salesPhone' => '+51 987 654 321',
                    'salesWhatsapp' => '51987654321',
                    'whatsappWelcomeMessage' => 'Hola Software Architec, deseo cotizar una solución tecnológica para mi empresa.',
                    'supportPhone' => '+51 987 654 322',
                    'salesEmail' => 'contacto@softwarearchitec.com',
                    'supportEmail' => 'soporte@softwarearchitec.com',
                    'businessHours' => 'Lunes a Sábado: 8:30 AM - 7:00 PM (Soporte crítico 24/7)',
                    'bcpAccount' => '',
                    'bcpCci' => '',
                    'bbvaAccount' => '',
                    'bbvaCci' => '',
                    'interbankAccount' => '',
                    'interbankCci' => '',
                    'bankAccountHolder' => 'Software Architec SAC',
                    'yapePhone' => '',
                    'yapeHolder' => 'Software Architec SAC',
                    'plinPhone' => '',
                    'plinHolder' => 'Software Architec SAC',
                    'instagramUrl' => 'https://instagram.com/softwarearchitec',
                    'tiktokUrl' => 'https://tiktok.com/@softwarearchitec',
                    'linkedinUrl' => 'https://linkedin.com/company/softwarearchitec',
                    'facebookUrl' => 'https://facebook.com/softwarearchitec',
                    'youtubeUrl' => 'https://youtube.com/@softwarearchitec',
                    'slaUptime' => '99.9%',
                    'serverLatency' => '<1s',
                    'storageType' => 'Almacenamiento NVMe SSD',
                    'defaultDeliveryDays' => '3 a 5 días hábiles',
                    'currencySymbol' => 'S/',
                    'currencyCode' => 'PEN',
                    'variashopDemoUrl' => '/servicios/saas',
                ],
            ]
        );

        if (SaasProduct::query()->count() === 0) {
            foreach ([
                [
                    'name' => 'VariaShop Pro',
                    'description' => 'E-commerce con checkout, stock y notificaciones WhatsApp.',
                    'category' => 'E-commerce',
                    'status' => 'Activo',
                    'setup_fee' => 1200,
                    'monthly_fee' => 250,
                    'active_clients' => 0,
                    'tech_stack' => ['React', 'Laravel', 'MySQL'],
                    'icon_name' => 'ShoppingCart',
                    'image_urls' => [],
                ],
                [
                    'name' => 'SmartPOS Retail',
                    'description' => 'Punto de venta omnicanal con facturación e inventario.',
                    'category' => 'Gestión & ERP',
                    'status' => 'Activo',
                    'setup_fee' => 500,
                    'monthly_fee' => 150,
                    'active_clients' => 0,
                    'tech_stack' => ['Vue.js', 'Laravel', 'MySQL'],
                    'icon_name' => 'Box',
                    'image_urls' => [],
                ],
                [
                    'name' => 'Módulo WhatsApp API',
                    'description' => 'Notificaciones y bot conversacional integrado al ERP.',
                    'category' => 'Módulos Extra',
                    'status' => 'Beta',
                    'setup_fee' => 200,
                    'monthly_fee' => 80,
                    'active_clients' => 0,
                    'tech_stack' => ['Node.js', 'Meta API'],
                    'icon_name' => 'Puzzle',
                    'image_urls' => [],
                ],
            ] as $item) {
                SaasProduct::query()->create($item);
            }
        }

        if (WikiCategory::query()->count() === 0) {
            $admin = User::query()->where('email', 'admin@softwarearchitec.pe')->first();
            $ops = WikiCategory::query()->create(['name' => 'Operaciones', 'sort' => 1]);
            WikiCategory::query()->create(['name' => 'Desarrollo', 'sort' => 2]);

            WikiArticle::query()->create([
                'wiki_category_id' => $ops->id,
                'title' => 'Alta de cliente SaaS',
                'author' => $admin?->name ?? 'Admin',
                'tags' => ['onboarding', 'saas'],
                'content' => "## Alta de cliente SaaS\n\n1. Crear cliente en el módulo Clientes.\n2. Asignar suscripción y fecha de cobro.\n3. Enviar accesos por WhatsApp/Email.\n4. Registrar credenciales en la bóveda.",
            ]);
        }

        $this->call(WikiDeployProceduresSeeder::class);
        $this->call(WikiDevGuidesSeeder::class);
    }
}
