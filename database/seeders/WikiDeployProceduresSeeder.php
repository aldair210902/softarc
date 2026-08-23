<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\WikiArticle;
use App\Models\WikiCategory;
use Illuminate\Database\Seeder;

class WikiDeployProceduresSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->where('email', 'admin@softwarearchitec.pe')->first();
        $author = $admin?->name ?? 'Admin';

        $ops = WikiCategory::query()->firstOrCreate(
            ['name' => 'Operaciones'],
            ['sort' => 1]
        );
        $dev = WikiCategory::query()->firstOrCreate(
            ['name' => 'Desarrollo'],
            ['sort' => 2]
        );

        $this->upsertArticle($dev->id, $author, [
            'title' => 'Despliegue local → servidor (FileZilla, BD y GitHub)',
            'tags' => ['deploy', 'filezilla', 'github', 'base-de-datos', 'env'],
            'content' => $this->deployGuideContent(),
        ]);

        $this->upsertArticle($dev->id, $author, [
            'title' => 'Checklist de despliegue',
            'tags' => ['deploy', 'devops', 'checklist'],
            'content' => $this->checklistContent(),
        ]);

        $this->upsertArticle($ops->id, $author, [
            'title' => 'Respaldo antes de actualizar (archivos y BD)',
            'tags' => ['backup', 'seguridad', 'deploy'],
            'content' => $this->backupContent(),
        ]);
    }

    private function upsertArticle(int $categoryId, string $author, array $data): void
    {
        $existing = WikiArticle::query()->where('title', $data['title'])->first();

        if ($existing) {
            $existing->update([
                'wiki_category_id' => $categoryId,
                'author' => $author,
                'tags' => $data['tags'],
                'content' => $data['content'],
            ]);

            return;
        }

        WikiArticle::query()->create([
            'wiki_category_id' => $categoryId,
            'title' => $data['title'],
            'author' => $author,
            'tags' => $data['tags'],
            'content' => $data['content'],
        ]);
    }

    private function deployGuideContent(): string
    {
        return <<<'MD'
DESPLIEGUE: DE LOCAL AL SERVIDOR
================================
Guía para subir un sistema/proyecto (Laravel / PHP / SoftArc u otros) desde tu PC al hosting con FileZilla, actualizar la base de datos si hace falta, y sincronizar con GitHub.

Importante: nunca subas secretos (contraseñas, .env de producción) a GitHub. El .env del servidor se configura a mano en el hosting.


1) PREPARACIÓN EN LOCAL
-----------------------
1. Probar que el proyecto funciona en local.
2. Ejecutar build del frontend (si aplica):
   npm install
   npm run build
3. Revisar que no haya cambios a medias sin probar.
4. Tener a mano:
   - Host FTP/SFTP, usuario, contraseña y puerto (normalmente 21 FTP o 22 SFTP).
   - Ruta remota (ej. public_html, www, o carpeta del dominio).
   - Acceso a phpMyAdmin / MySQL del servidor.
   - Copia del .env de producción (si ya existe) o valores de BD, APP_URL, correo, etc.


2) QUÉ ARCHIVOS SUBIR Y CUÁLES NO (FileZilla)
---------------------------------------------
SÍ subir (código y assets necesarios):
- app/
- bootstrap/ (excepto cache generado, ver abajo)
- config/
- database/ (migraciones y seeders; no dumps con datos sensibles salvo que lo necesites)
- public/ (incluye public/build/ si compilaste en local)
- resources/
- routes/
- lang/ o resources/lang/ (si existen)
- composer.json y composer.lock
- package.json y package-lock.json (si el build se hace en servidor)
- artisan
- .htaccess de la raíz (si el hosting lo usa) y public/.htaccess
- Archivos de configuración del proyecto que NO sean secretos

NO subir (evita errores, peso y riesgos de seguridad):
- .env          → NUNCA. Contiene claves, BD y secretos. Se crea/edita solo en el servidor.
- .env.backup, .env.*.local
- node_modules/ → pesado; se regenera con npm install en servidor o no hace falta si ya subes public/build
- vendor/       → preferible regenerar en servidor con: composer install --no-dev --optimize-autoloader
                 (solo súbelo si el hosting NO tiene SSH/Composer)
- .git/         → no hace falta por FTP; usa Git en servidor si tienes SSH
- storage/logs/*.log
- storage/framework/cache/* (contenido, no la estructura de carpetas)
- storage/framework/sessions/*
- storage/framework/views/*
- bootstrap/cache/*.php (excepto .gitignore si existe)
- tests/ (opcional; no necesarios en producción)
- .idea/, .vscode/, .cursor/
- Archivos temporales: *.tmp, *.bak, Thumbs.db, .DS_Store
- Dumps SQL con datos reales en el repo o en carpetas públicas

Estructura de carpetas en storage (sí debe existir en servidor, aunque vacía):
- storage/app/public
- storage/framework/cache
- storage/framework/sessions
- storage/framework/views
- storage/logs
- bootstrap/cache

Permisos típicos en Linux/cPanel (vía Administrador de archivos o SSH):
- storage/ y bootstrap/cache/ → escritura (775 o 755 según hosting; el usuario web debe poder escribir)


3) PASOS CON FILEZILLA (primera subida o actualización grande)
--------------------------------------------------------------
A) Conexión
1. Abrir FileZilla → Archivo → Gestor de sitios.
2. Protocolo: preferir SFTP si el hosting lo ofrece (más seguro que FTP).
3. Host, usuario, contraseña, puerto.
4. Conectar y localizar la carpeta del sitio (public_html, softarc, etc.).

B) Document root
- En Laravel, el dominio debe apuntar a la carpeta public/ (no a la raíz del proyecto).
- Si el hosting solo sirve public_html/:
  - Opción 1: subir el proyecto fuera de public_html y poner solo el contenido de public/ dentro de public_html, ajustando index.php (rutas ../).
  - Opción 2: subir todo dentro de public_html y configurar el document root a public_html/public (cPanel → Dominios).

C) Subida
1. En local: carpeta del proyecto.
2. En remoto: carpeta destino.
3. Arrastrar solo lo permitido (ver sección 2).
4. Si actualizas un sitio ya en producción:
   - NO sobrescribas el .env del servidor.
   - NO borres storage/app (archivos subidos por usuarios) salvo que sepas lo que haces.
   - Haz respaldo antes (ver artículo de respaldo).

D) Después de subir archivos
1. Crear/editar .env EN EL SERVIDOR (Administrador de archivos o SSH). Puedes partir de .env.example.
2. Ajustar al menos:
   APP_NAME=
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://tudominio.com
   APP_KEY=   (generar en servidor, ver comandos abajo)
   DB_CONNECTION=mysql
   DB_HOST=
   DB_PORT=3306
   DB_DATABASE=
   DB_USERNAME=
   DB_PASSWORD=
   SESSION_DRIVER=file (o el que uses en prod)
   MAIL_*, QUEUE_*, etc. según el proyecto
3. Si hay SSH:
   composer install --no-dev --optimize-autoloader
   php artisan key:generate   (solo si APP_KEY está vacío; no regeneres si ya hay datos cifrados)
   php artisan storage:link
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
4. Si NO hay SSH:
   - Sube vendor/ generado en local con composer install --no-dev
   - Sube public/build/ ya compilado (npm run build en local)
   - Crea el enlace storage manualmente o con el panel
   - Importa la BD por phpMyAdmin (sección 4)


4) ACTUALIZAR / MIGRAR LA BASE DE DATOS
---------------------------------------
Elige UN flujo según el caso.

Caso A — Proyecto nuevo en el servidor (BD vacía)
1. Crear base de datos y usuario en cPanel/MySQL.
2. Poner esos datos en el .env del servidor.
3. Opción recomendada (SSH):
   php artisan migrate --force
   php artisan db:seed --force   (solo si hay seeders seguros para producción)
4. Opción sin SSH:
   - En local: exportar estructura (y datos iniciales) desde phpMyAdmin o:
     mysqldump -u usuario -p nombre_bd > backup_local.sql
   - En servidor (phpMyAdmin): Importar el .sql
   - Preferible exportar solo estructura + seed mínimo, no datos de prueba basura.

Caso B — Ya hay producción y solo cambió el código (migraciones nuevas)
1. RESPALDAR la BD de producción primero.
2. Con SSH:
   php artisan migrate --force
3. Sin SSH:
   - Revisar database/migrations nuevas
   - Aplicar los cambios SQL equivalentes a mano en phpMyAdmin, o
   - Pedir a alguien con SSH que ejecute migrate
4. No importes un dump completo de local encima de producción: perderías datos reales de clientes.

Caso C — Necesitas copiar datos de local a un staging (no producción real)
1. Exportar BD local (mysqldump o phpMyAdmin → Exportar).
2. En staging: vaciar/importar con cuidado.
3. Después de importar, revisar .env (URLs, correos) y ejecutar:
   php artisan config:clear
   (o borrar caches en bootstrap/cache si no hay artisan por SSH)

Antes de cualquier importación destructiva:
- Descarga un .sql del servidor actual.
- Guarda también una copia ZIP de archivos (sobre todo storage/ y .env).


5) GITHUB: SUBIR (local → remoto) Y BAJAR (servidor ← remoto)
-------------------------------------------------------------
Regla de oro: el código va a GitHub; los secretos (.env) NO.

A) Primera vez en local
   git init
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   # Asegúrate de que .gitignore ignore: .env, /vendor, /node_modules, /public/build (opcional), storage/logs, etc.
   git add .
   git status
   git commit -m "Descripción clara del cambio"
   git branch -M main
   git push -u origin main

B) Subir cambios cotidianos (desde tu PC)
   git status
   git add .
   git commit -m "Qué cambió y por qué"
   git push

C) Bajar / actualizar en el servidor (si hay SSH y el proyecto es un clone de Git)
   cd /ruta/del/proyecto
   git pull origin main
   composer install --no-dev --optimize-autoloader
   npm ci && npm run build    # si el frontend se compila en servidor
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   php artisan storage:link   # solo si aún no existe

D) Si el servidor NO tiene Git/SSH
   - Trabajas con Git solo en local → GitHub.
   - Al servidor subes por FileZilla el código (sin .env, sin node_modules, idealmente sin vendor).
   - Misma lista de “qué subir / qué no”.

E) Bajar el código a otra PC
   git clone https://github.com/TU_USUARIO/TU_REPO.git
   cd TU_REPO
   copy .env.example .env     # Windows
   # o: cp .env.example .env  # Linux/Mac
   composer install
   npm install
   php artisan key:generate
   # Configurar DB_* en .env
   php artisan migrate
   npm run build
   php artisan serve   # o usar XAMPP apuntando a public/


6) EL ARCHIVO .env (indicaciones)
---------------------------------
- Existe uno por entorno: local, staging, producción. Son distintos.
- Nunca lo subas a GitHub ni lo compartas por WhatsApp/chat sin cuidado.
- En GitHub solo debe existir .env.example (plantilla sin secretos reales).
- Al actualizar por FileZilla: excluye .env en la cola de transferencia o usa “sobrescribir solo si es más reciente” con mucho cuidado; lo más seguro es no tocar el .env remoto.
- Si cambias APP_KEY en un sistema que ya cifra datos (bóveda, cookies, etc.), esos datos dejarán de descifrarse. No regeneres la key en producción salvo caso extremo y con plan de migración.
- APP_DEBUG=false en producción siempre.
- APP_URL debe coincidir con la URL real (http vs https).


7) FRONTEND (Vite / npm)
------------------------
Opción recomendada sin SSH en hosting:
1. En local: npm run build
2. Subir la carpeta public/build/ y public/hot no debe existir en prod
3. Asegurar que el manifest en public/build esté actualizado

Opción con SSH:
   npm ci
   npm run build


8) COMPROBACIONES FINALES
-------------------------
- Abrir la URL del sitio (y /public/admin si aplica).
- Probar login.
- Revisar que no se vean errores con APP_DEBUG=false (página genérica, no stack trace).
- Verificar formularios, subida de archivos y enlaces a storage.
- Healthcheck si existe (ej. /up).
- Revisar permisos de storage/ si hay errores 500 al escribir logs o cache.
- SSL/HTTPS activo en el dominio.


9) ACTUALIZACIONES RÁPIDAS (día a día)
--------------------------------------
Solo cambió PHP/Blade/JS fuente:
1. git push desde local (o subir por FileZilla solo archivos tocados).
2. En servidor: git pull (o FileZilla) + npm run build si cambió el front + caches artisan.

Solo cambió BD (nueva migración):
1. Respaldo BD.
2. Subir migración / git pull.
3. php artisan migrate --force.

Cambió .env (nuevo mailer, nueva API key):
1. Editar .env SOLO en el servidor.
2. php artisan config:clear && php artisan config:cache


10) ERRORES FRECUENTES
----------------------
- Pantalla en blanco / 500: revisar storage/logs/laravel.log y permisos de storage.
- CSS/JS viejos: faltó subir public/build o limpiar caché del navegador.
- Error de BD: credenciales .env o migraciones pendientes.
- Rutas 404: document root no apunta a public/, o falta route:cache regenerado tras cambios.
- “No application encryption key”: falta APP_KEY en .env.
- Vendor missing: no corriste composer install y no subiste vendor/.
MD;
    }

    private function checklistContent(): string
    {
        return <<<'MD'
CHECKLIST RÁPIDO DE DESPLIEGUE
==============================
Usar junto con el artículo: "Despliegue local → servidor (FileZilla, BD y GitHub)".

Antes
[ ] Respaldo de archivos y BD en producción
[ ] Cambios probados en local
[ ] npm run build (si hay frontend)
[ ] Revisar que .env NO se vaya a sobrescribir en el servidor
[ ] APP_DEBUG=false previsto para producción

Transferencia
[ ] Subir solo código permitido (sin .env, sin node_modules; vendor solo si no hay Composer en servidor)
[ ] No borrar storage/app con archivos de clientes
[ ] Document root → carpeta public/

Servidor
[ ] .env de producción correcto (APP_URL, DB_*, mailers)
[ ] composer install --no-dev --optimize-autoloader
[ ] php artisan key:generate solo si APP_KEY vacío
[ ] php artisan storage:link
[ ] php artisan migrate --force (tras respaldo)
[ ] php artisan config:cache && route:cache && view:cache

GitHub (si aplica)
[ ] git add / commit / push desde local
[ ] git pull en servidor (o FileZilla equivalente)
[ ] .env y secretos fuera del repositorio

Verificación
[ ] Sitio abre en HTTPS
[ ] Login OK
[ ] Formularios / subidas OK
[ ] Sin stack traces públicos
[ ] /up o healthcheck OK (si existe)
MD;
    }

    private function backupContent(): string
    {
        return <<<'MD'
RESPALDO ANTES DE ACTUALIZAR
============================
Hazlo siempre antes de FileZilla masivo, migrate, o importar SQL.

1) Archivos
- Por FileZilla: descarga al menos .env, storage/app y la carpeta del proyecto (o un ZIP desde cPanel → Respaldo).
- Guarda la fecha en el nombre: softarc_files_2026-08-15.zip

2) Base de datos
- cPanel → phpMyAdmin → Exportar (método rápido / SQL)
- O por SSH:
  mysqldump -u USUARIO -p NOMBRE_BD > softarc_db_2026-08-15.sql

3) Qué conservar fuera del servidor
- El .sql del respaldo
- El .env de producción (en lugar seguro, no en GitHub)
- ZIP de storage si hay archivos de clientes

4) Restaurar (emergencia)
- Archivos: subir el ZIP / carpeta respaldada (sin pisar a ciegas si ya hay cambios nuevos que quieras conservar)
- BD: phpMyAdmin → Importar el .sql (puede sobrescribir tablas; confirma que es el respaldo correcto)

Regla: sin respaldo reciente, no ejecutes migrate --force ni imports destructivos en producción.
MD;
    }
}
