<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\WikiArticle;
use App\Models\WikiCategory;
use Illuminate\Database\Seeder;

class WikiDevGuidesSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->where('email', 'admin@softwarearchitec.pe')->first();
        $author = $admin?->name ?? 'Admin';

        $laravel = WikiCategory::query()->firstOrCreate(['name' => 'Laravel'], ['sort' => 10]);
        $react = WikiCategory::query()->firstOrCreate(['name' => 'React / AI Studio / Cursor'], ['sort' => 20]);
        $git = WikiCategory::query()->firstOrCreate(['name' => 'Git & Commits'], ['sort' => 30]);
        $libs = WikiCategory::query()->firstOrCreate(['name' => 'Librerías y paquetes'], ['sort' => 40]);
        $flows = WikiCategory::query()->firstOrCreate(['name' => 'Pasos de trabajo'], ['sort' => 5]);

        WikiCategory::query()->firstOrCreate(['name' => 'Operaciones'], ['sort' => 1]);
        WikiCategory::query()->firstOrCreate(['name' => 'Desarrollo'], ['sort' => 2]);

        $this->upsert($flows->id, $author, [
            'title' => '¿Qué situación tengo? (elige tu ruta)',
            'tags' => ['flujo', 'softarc', 'inicio', 'checklist'],
            'content' => $this->stepsWhichSituation(),
        ]);

        $this->upsert($flows->id, $author, [
            'title' => 'Ya tengo proyecto + dominio/hosting → meterlo en SoftArc hoy',
            'tags' => ['flujo', 'existente', 'hosting', 'dominio', 'softarc'],
            'content' => $this->stepsExistingWithHosting(),
        ]);

        $this->upsert($flows->id, $author, [
            'title' => 'Ya tengo proyecto (código) pero aún no lo registro hosting',
            'tags' => ['flujo', 'existente', 'local', 'github', 'softarc'],
            'content' => $this->stepsExistingCodeOnly(),
        ]);

        $this->upsert($flows->id, $author, [
            'title' => 'Pasos: cuando CREO un proyecto nuevo',
            'tags' => ['flujo', 'crear', 'checklist', 'github', 'cursor', 'softarc'],
            'content' => $this->stepsCreateProject(),
        ]);

        $this->upsert($flows->id, $author, [
            'title' => 'Pasos: cuando EDITO un proyecto existente',
            'tags' => ['flujo', 'editar', 'checklist', 'git', 'cursor'],
            'content' => $this->stepsEditProject(),
        ]);

        $this->upsert($flows->id, $author, [
            'title' => 'Flujo oficial: PC ↔ Laptop ↔ GitHub ↔ Producción',
            'tags' => ['flujo', 'github', 'filezilla', 'pc', 'laptop', 'produccion'],
            'content' => $this->stepsPcLaptopGithubProd(),
        ]);

        $this->upsert($flows->id, $author, [
            'title' => 'cPanel → PC → GitHub → Laptop (paso a paso)',
            'tags' => ['cpanel', 'filezilla', 'github', 'laptop', 'descargar'],
            'content' => $this->stepsCpanelToGithubToLaptop(),
        ]);

        $this->upsert($git->id, $author, [
            'title' => 'Glosario de comandos (para qué / cuándo)',
            'tags' => ['git', 'laravel', 'npm', 'glosario', 'comandos'],
            'content' => $this->commandGlossary(),
        ]);

        $this->upsert($laravel->id, $author, [
            'title' => 'Crear proyecto Laravel desde cero',
            'tags' => ['laravel', 'setup', 'composer', 'xampp'],
            'content' => $this->laravelCreate(),
        ]);

        $this->upsert($laravel->id, $author, [
            'title' => 'Comandos Artisan que más usamos',
            'tags' => ['laravel', 'artisan', 'comandos'],
            'content' => $this->laravelArtisan(),
        ]);

        $this->upsert($react->id, $author, [
            'title' => 'De Google AI Studio a Cursor (React)',
            'tags' => ['react', 'ai-studio', 'cursor', 'vite'],
            'content' => $this->aiStudioToCursor(),
        ]);

        $this->upsert($react->id, $author, [
            'title' => 'Montar React + TypeScript + Vite',
            'tags' => ['react', 'vite', 'typescript'],
            'content' => $this->reactVite(),
        ]);

        $this->upsert($git->id, $author, [
            'title' => 'Mensajes de commit listos para pegar',
            'tags' => ['git', 'commits', 'convención'],
            'content' => $this->commits(),
        ]);

        $this->upsert($git->id, $author, [
            'title' => 'Flujo Git diario (clonar, rama, push)',
            'tags' => ['git', 'github', 'flujo'],
            'content' => $this->gitFlow(),
        ]);

        $this->upsert($git->id, $author, [
            'title' => 'Crear o conectar repo en GitHub (comandos)',
            'tags' => ['git', 'github', 'remoto', 'push'],
            'content' => $this->githubNewOrExisting(),
        ]);

        $this->upsert($libs->id, $author, [
            'title' => 'Paquetes típicos Laravel + front',
            'tags' => ['composer', 'npm', 'librerías'],
            'content' => $this->libraries(),
        ]);
    }

    private function upsert(int $categoryId, string $author, array $data): void
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

    private function stepsWhichSituation(): string
    {
        return <<<'MD'
## Objetivo
Elegir la ruta correcta según lo que ya tengas. SoftArc sirve tanto para **proyectos que ya existen** como para los que **harás más adelante**.

## Tabla rápida

| Tu situación | Abre esta guía en la wiki |
|---|---|
| Ya tienes web en producción (dominio + hosting + accesos) | **Ya tengo proyecto + dominio/hosting → meterlo en SoftArc hoy** |
| El sitio está en el hosting pero NO en tu PC/laptop | **cPanel → PC → GitHub → Laptop (paso a paso)** |
| Ya tienes el código en el PC / GitHub, pero aún no cargas hosting en SoftArc | **Ya tengo proyecto (código) pero aún no lo registro hosting** |
| Todavía no existe el proyecto (lo harás después) | **Pasos: cuando CREO un proyecto nuevo** |
| El proyecto ya está en SoftArc y solo vas a cambiar código | **Pasos: cuando EDITO un proyecto existente** |
| Quieres el mapa completo PC/Laptop → GitHub → FileZilla | **Flujo oficial: PC ↔ Laptop ↔ GitHub ↔ Producción** |

## Orden SoftArc (siempre el mismo)
1. **Cliente** → `/admin/clients`
2. **Hosting** (servidor + dominio + bóveda) → preferido: `/admin/infra/hosting-wizard`
3. **Proyecto** → `/admin/projects` (repo GitHub, rutas PC, notas)

> Las contraseñas van en **Bóveda** (`/admin/infra/credentials`), no en el módulo Servidores.

## Qué datos tener a mano (existentes)
- Razón social / nombre del cliente
- Dominio (ej. `cliente.com`)
- IP o cuenta del hosting, proveedor, plan
- URL cPanel / Webmail
- Usuario y clave cPanel, FTP, base de datos
- URL del repo GitHub (si existe)
- Carpeta local en tu PC (si ya programas ahí)

## Empezar HOY con lo que ya tienes
1. Abre **Ya tengo proyecto + dominio/hosting…**
2. Registra 1 cliente real de punta a punta (wizard + proyecto).
3. Verifica en el detalle del cliente: sitio, cPanel, FileZilla, bóveda.
4. Repite con el siguiente cliente/proyecto.

Cuando más adelante crees algo nuevo, usa la guía de **CREO un proyecto nuevo** (código + GitHub + SoftArc).
MD;
    }

    private function stepsExistingWithHosting(): string
    {
        return <<<'MD'
## Cuándo usar esta guía
El cliente **ya tiene** dominio, hosting y accesos (cPanel, FTP, BD…). Quieres **usar SoftArc desde hoy**: cargarlo bien, sin reinventar el proyecto.

## Resultado esperado
- Cliente en `/admin/clients`
- Servidor + dominio vinculados
- Credenciales en bóveda (cPanel, FTP, BD…)
- Proyecto con repo/rutas (si aplica)
- Desde SoftArc: sitio, cPanel, webmail y FileZilla

---

## 0) Junta estos datos
- [ ] Nombre del cliente / razón social + contacto
- [ ] Dominio (sin `https://` ni `www`)
- [ ] Proveedor / plan / IP del servidor
- [ ] URL cPanel y usuario/clave
- [ ] FTP: host, usuario, clave, puerto
- [ ] Base de datos: nombre, usuario, clave
- [ ] Webmail (si lo usan)
- [ ] Repo GitHub (si existe)
- [ ] Ruta local en tu PC (si ya editas ahí)

## 1) Crear el cliente
Ruta: `/admin/clients` → **Nuevo cliente**
1. Razón social y contacto (mínimo).
2. Teléfono / email si los tienes.
3. Suscripción solo si ya cobras; si no, después.
4. Guarda.

## 2) Registrar hosting + dominio (atajo)
Ruta: `/admin/infra/hosting-wizard`

1. Elige el **cliente** recién creado.
2. Cuenta de hosting (nombre, IP, proveedor, plan, URLs panel).
3. Dominio + nameservers + vencimiento.
4. cPanel / FTP / webmail cuando el wizard lo pida.
5. Guarda el paquete.

### Alternativa manual
1. `/admin/infra/servers` → servidor (sin passwords).
2. `/admin/infra/domains` → dominio → mismo cliente + servidor.
3. `/admin/infra/credentials` → bóveda vinculada a **cliente + dominio**.

## 3) Completar bóveda
Ruta: `/admin/infra/credentials`

Al menos:
- **cPanel / Hosting** → URL + usuario + clave
- **FTP** → host + usuario + clave
- **Bases de datos** → acceso + user + clave (+ nombre BD en nota)

## 4) Registrar el proyecto
Ruta: `/admin/projects` → **Nuevo proyecto**
1. Mismo cliente.
2. Nombre del sistema / sitio.
3. Estado real.
4. `repoUrl` de GitHub si existe.
5. Rutas PC/laptop.
6. Notas de BD/cPanel si ayudan.

## 5) Verificar SoftArc
En detalle de **cliente** o **proyecto**:
- [ ] Abre el sitio
- [ ] Abre cPanel / webmail
- [ ] Copia FileZilla desde la bóveda
- [ ] Ves el repo GitHub si lo cargaste

## 6) Si vas a editar código ya

```bash title:Clonar para editar desc:Para qué: trae el código a tu PC. Cuándo: vas a modificar un proyecto con hosting.
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO
cursor .
```

Luego: guía **Pasos: cuando EDITO un proyecto existente**.

## Errores a evitar
- Passwords en Servidores (van en **Bóveda**)
- Dominio sin vincular **servidor** y **cliente**
- Proyecto sin cliente → no verás el hosting en el detalle
- Subir `.env` de producción a GitHub
MD;
    }

    private function stepsExistingCodeOnly(): string
    {
        return <<<'MD'
## Cuándo usar esta guía
Ya tienes el **código** (PC y/o GitHub), pero en SoftArc aún no están cliente / hosting / proyecto. El hosting puede existir “afuera” o no.

## Camino corto (usar SoftArc hoy)
1. `/admin/clients` → crear cliente
2. `/admin/projects` → proyecto (cliente + repo + rutas)
3. Si **sí** tienes dominio/hosting → guía **Ya tengo proyecto + dominio/hosting…**
4. Si **aún no** hay hosting → cuando lo contrates: `/admin/infra/hosting-wizard`

## 1) Asegurar GitHub

```bash title:Push del código existente desc:Para qué: respaldo en GitHub. Cuándo: tienes carpeta local y el remoto está vacío o no existe.
cd ruta\al\proyecto
git status
git add .
git commit -m "chore: registrar proyecto existente en GitHub"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

## 2) SoftArc — cliente + proyecto
1. `/admin/clients` → razón social + contacto.
2. `/admin/projects` → cliente, `repoUrl`, rutas PC, estado actual.

Con eso ya organizas avance, abres GitHub desde el detalle y dejas el trabajo visible en el hub.

## 3) Cuando tengas datos de hosting
Usa **Ya tengo proyecto + dominio/hosting → meterlo en SoftArc hoy**.

Orden: `Cliente (ya existe) → Hosting Wizard → Bóveda → verificar proyecto`.

## 4) Empezar a editar
Guía **Pasos: cuando EDITO un proyecto existente**.
MD;
    }

    private function stepsCreateProject(): string
    {
        return <<<'MD'
## Cuándo usar esta guía
El proyecto **aún no existe** (lo harás más adelante o lo empiezas ahora). SoftArc + código + GitHub + hosting cuando toque.

## Dos momentos
1. **Ahora (aunque no programes hoy):** registra **cliente** + **proyecto en Planificación**.
2. **Cuando construyas:** crea código, GitHub y luego hosting.

---

## A) SoftArc antes de programar (recomendado)
1. `/admin/clients` → crea el cliente.
2. `/admin/projects` → estado **Planificación** (repo vacío o pendiente).
3. Anota alcance, plazos, montos si aplica.

## B) Cuando crees el código

```bash title:Laravel nuevo desc:Para qué: scaffolding PHP. Cuándo: backend/admin Laravel.
composer create-project laravel/laravel nombre-proyecto
cd nombre-proyecto
copy .env.example .env
php artisan key:generate
```

```bash title:React + Vite desc:Para qué: front moderno. Cuándo: SPA o base para AI Studio.
npm create vite@latest nombre-proyecto -- --template react-ts
cd nombre-proyecto
npm install
```

**AI Studio:** Vite → `cursor .` → pegar código → deps (guía React / AI Studio / Cursor).

```bash title:Abrir en Cursor desc:Para qué: editar. Cuándo: ya estás en la carpeta del proyecto.
cursor .
```

```bash title:Probar Laravel desc:Para qué: ver la app. Cuándo: .env listo.
php artisan migrate
php artisan serve
```

```bash title:Probar React desc:Para qué: dev server. Cuándo: front Vite.
npm run dev
```

```bash title:Primer push desc:Para qué: respaldo remoto. Cuándo: el código base ya corre.
git init
git add .
git commit -m "feat: primer commit del proyecto"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

## C) Actualizar SoftArc + hosting
1. Edita el proyecto: `repoUrl`, rutas, estado **En desarrollo**.
2. Cuando contrates hosting: `/admin/infra/hosting-wizard` con el mismo cliente.
3. Despliegue: wiki **Despliegue local → servidor**.

## Checklist crear
- [ ] Cliente en SoftArc
- [ ] Proyecto en SoftArc (aunque sea Planificación)
- [ ] Código local + Cursor
- [ ] Repo GitHub + push
- [ ] Hosting/bóveda cuando existan
- [ ] `.env` fuera de GitHub
MD;
    }

    private function stepsEditProject(): string
    {
        return <<<'MD'
## Cuándo usar esta guía
El proyecto **ya está** (código y, idealmente, en SoftArc). Vas a **cambiar algo** y subir / desplegar.

> Si aún no está en SoftArc: **Ya tengo proyecto + dominio/hosting…** o **Ya tengo proyecto (código)…**.

## Resumen
1. SoftArc: confirma cliente / proyecto / bóveda
2. `git pull` → rama → Cursor → probar
3. Commit + push
4. Si hay hosting: desplegar

---

## 1) Mira SoftArc primero
1. `/admin/projects` → abre el proyecto.
2. Confirma cliente, repo, rutas.
3. Si hay hosting: prueba cPanel / FileZilla / sitio.
4. Completa bóveda si faltan claves: `/admin/infra/credentials`.

## 2) Código al día

```bash title:Actualizar y abrir desc:Para qué: no trabajar sobre copia vieja. Cuándo: cada vez que vuelves al proyecto.
cd ruta\al\proyecto
git checkout main
git pull origin main
cursor .
```

```bash title:Clonar (primera vez) desc:Para qué: traer el repo. Cuándo: no tienes la carpeta en esta PC.
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO
npm install
composer install
cursor .
```

## 3) Rama + editar + probar

```bash title:Nueva rama desc:Para qué: no romper main. Cuándo: cambios medianos o hay producción.
git checkout -b fix/o-feature-nombre-corto
```

```bash title:Probar Laravel desc:Para qué: validar. Cuándo: cambios PHP/front Laravel.
php artisan optimize:clear
php artisan serve
```

```bash title:Probar React desc:Para qué: ver UI. Cuándo: componentes/estilos.
npm run dev
```

```bash title:Build desc:Para qué: compilar producción. Cuándo: antes de desplegar front.
npm run build
```

## 4) Commit + push

```bash title:Guardar y subir desc:Para qué: dejar el cambio en GitHub. Cuándo: ya probaste en local.
git status
git add .
git commit -m "fix: descripción clara"
git push -u origin fix/o-feature-nombre-corto
```

## 5) Si hay dominio/hosting
1. Respaldo rápido (wiki **Respaldo…**).
2. FileZilla o `git pull` en servidor.
3. Front: subir `public/build` tras build.
4. Laravel: `migrate` solo si hay migraciones; luego `optimize:clear`.
5. Verificar el dominio.

Datos FTP/cPanel: bóveda SoftArc del cliente.

## Checklist editar
- [ ] SoftArc: cliente + proyecto (+ bóveda si hay hosting)
- [ ] `git pull` antes de editar
- [ ] Probado en local
- [ ] Commit + push
- [ ] Producción verificada (si aplica)
- [ ] Sin `.env` ni claves en GitHub
MD;
    }

    private function stepsPcLaptopGithubProd(): string
    {
        return <<<'MD'
## La idea (sí, vas bien)
1. **GitHub = la fuente de verdad del código** (PC y laptop jalan/suben ahí).
2. **SoftArc = la fuente de verdad de clientes, hosting y claves** (FTP, cPanel, BD).
3. **Producción = FileZilla** (u otro deploy) usando los datos de la **bóveda** SoftArc.

No uses el pen drive / WhatsApp / copiar carpetas entre PC y laptop como método principal.

## Esquema
`PC o Laptop (editas) → git push → GitHub → (otra máquina: git pull) → pruebas locales → FileZilla → Hosting (producción)`

---

## Fase 0 — Una sola vez por proyecto
1. Elige la copia **más completa/actual** (PC o laptop).
2. Súbela a GitHub (repo nuevo o conectar existente).
3. En la **otra** máquina: `git clone` (no copies la carpeta a mano).
4. Registra en SoftArc: cliente → hosting/bóveda → proyecto + `repoUrl`.

```bash title:Primera subida a GitHub (máquina con el código bueno) desc:Para qué: dejar el proyecto centralizado. Cuándo: aún no está en GitHub o el remoto está vacío.
cd ruta\al\proyecto
git init
git add .
git commit -m "chore: respaldo inicial del proyecto"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

```bash title:En la otra máquina (PC o laptop) desc:Para qué: misma base de código. Cuándo: la otra PC aún no tiene el repo.
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO
npm install
composer install
```

> `.env` **no** va a GitHub. En cada PC local crea tu `.env`. El de producción vive solo en el servidor / bóveda SoftArc.

---

## Solo está en producción (no lo tienes en PC ni laptop)
**Sí: tienes que bajarlo** a tu máquina. Luego lo subes a GitHub y ya entras al flujo normal.

### Orden recomendado
1. Registra cliente + hosting + bóveda en SoftArc (para tener FTP a mano).
2. Con FileZilla, **descarga** la carpeta del sitio (normalmente `public_html` o la carpeta del dominio) a tu PC.
3. No descargues basura innecesaria si puedes evitarlo (`node_modules`, cachés enormes, backups `.zip` viejos).
4. Crea repo en GitHub y haz el primer `push` desde esa copia.
5. En la laptop: `git clone` (ya no hace falta volver a bajar por FileZilla).
6. A partir de ahí: editas local → `push` → producción otra vez con FileZilla.

```text title:Qué bajar del hosting (orientativo) desc:Para qué: traer el código real que está en vivo. Cuándo: el proyecto no está en GitHub ni en tus PCs.
- public_html / www / htdocs del dominio
- Si es Laravel en hosting: la app completa (app, routes, resources, public…) según cómo esté armado
- Guarda aparte (NO en Git) el .env de producción: cópialo a SoftArc/bóveda o a un lugar seguro
```

### Si YA existe en GitHub
No bajes todo el hosting otra vez: en tu PC/laptop haz `git clone` / `git pull`. FileZilla solo para **subir** cambios a producción (o para traer archivos que nunca estuvieron en Git: uploads, `.env`, media).

### Cuidado
- La copia del servidor puede traer `.env` de producción → **no lo subas a GitHub**.
- Carpeta `storage` / `uploads` / imágenes de clientes: decide si van a Git o se quedan solo en servidor.
- Después de la primera bajada, **GitHub es el centro**; no uses FileZilla como “sync” entre PC y laptop.

---

## Día a día — trabajar en PC o laptop
1. SoftArc: confirma proyecto, repo y (si hay hosting) bóveda FTP.
2. En la máquina donde vas a trabajar:

```bash title:Antes de editar desc:Para qué: traer lo último de GitHub. Cuándo: cada vez que abres el proyecto (sobre todo si ayer trabajaste en la otra máquina).
cd ruta\al\proyecto
git checkout main
git pull origin main
cursor .
```

3. Edita y prueba en local.
4. Sube a GitHub **antes** de cambiar de máquina:

```bash title:Al terminar la sesión desc:Para qué: que la otra PC/laptop pueda continuar. Cuándo: terminas de trabajar o vas a cambiar de equipo.
git status
git add .
git commit -m "feat: o fix: lo que hiciste"
git push origin main
```

5. En la otra máquina: otra vez `git pull` y sigues.

## Producción — FileZilla con SoftArc
1. Abre el **cliente** o **proyecto** en SoftArc.
2. Copia host/usuario/clave FTP desde la **bóveda** (bloque FileZilla).
3. Conecta FileZilla al hosting.
4. Sube **solo lo necesario** (código/build). No subas `node_modules`, `.git` ni `.env` de local a lo loco.
5. Si hay front Vite: `npm run build` en local y sube `public/build` (o la carpeta de build del proyecto).
6. Verifica el dominio en el navegador.

> Detalle de qué subir/no subir: wiki **Despliegue local → servidor**.

## Qué corrigió tu idea
- **Sí:** primero centralizar en GitHub; PC y laptop trabajan con `pull`/`push`.
- **Sí:** producción con FileZilla usando datos del sistema (SoftArc/bóveda).
- **Matiz:** no “bajar de GitHub a producción” como paso obligatorio. El flujo típico es: **editas en local → push a GitHub (respaldo/sync) → FileZilla al hosting**. GitHub no reemplaza FileZilla en hosting compartido cPanel, salvo que el servidor tenga git.
- **Matiz:** en cada máquina hace falta `git pull` **antes** de editar, no solo “bajar una vez”.
- **Matiz:** SoftArc no guarda el código; guarda **quién es el cliente, hosting y secretos**.

## Checklist mental
- [ ] ¿Solo está en el hosting? → bajar con FileZilla → subir a GitHub → clone en la otra máquina
- [ ] ¿Está en GitHub? → si no, Fase 0
- [ ] ¿Voy a editar? → `pull` → Cursor → commit → `push`
- [ ] ¿Cambio de PC/laptop? → asegúrate de haber hecho `push` antes
- [ ] ¿Subo a producción? → bóveda SoftArc → FileZilla → verificar web
MD;
    }

    private function stepsCpanelToGithubToLaptop(): string
    {
        return <<<'MD'
## Qué vas a lograr
Bajar el sitio desde **cPanel/hosting** → dejarlo en tu **PC** → subirlo a **GitHub** → bajarlo en tu **laptop** con `git clone`.

## Antes de empezar
- [ ] Usuario y clave de **cPanel** o **FTP** (mejor desde SoftArc → Bóveda)
- [ ] Cuenta de **GitHub**
- [ ] Git instalado en PC y laptop (`git --version`)
- [ ] Carpeta local lista, ej. `C:\proyectos\`

---

## PARTE 1 — Descargar desde cPanel a tu PC

### Opción A — FileZilla (recomendada)
1. Abre SoftArc → cliente/proyecto → copia datos FTP de la bóveda  
   (o usa los de cPanel: host, usuario, clave, puerto 21).
2. Abre **FileZilla** → Nueva conexión con esos datos.
3. En el servidor (panel derecho) entra a la carpeta del sitio: suele ser `public_html` o `public_html/tudominio`.
4. En tu PC (panel izquierdo) crea/abre `C:\proyectos\nombre-proyecto`.
5. Arrastra la carpeta del sitio **del servidor → a tu PC** (descarga).
6. Espera a que termine (puede tardar).

### Opción B — Administrador de archivos de cPanel
1. Entra a **cPanel** → **Administrador de archivos**.
2. Entra a `public_html` (o la carpeta del dominio).
3. Selecciona los archivos/carpetas del proyecto → **Comprimir** (ZIP).
4. Descarga el ZIP a tu PC.
5. Descomprime en `C:\proyectos\nombre-proyecto`.

### Limpieza en la PC (importante)
Dentro de `C:\proyectos\nombre-proyecto`:
1. Si hay `.env`, **cópialo a un lugar seguro** (o a SoftArc/bóveda) y **sácalo de la carpeta** antes de subir a Git (o agrégalo a `.gitignore`).
2. Borra si existen y pesan mucho: `node_modules`, cachés, `.zip` de backups, logs enormes.
3. No borres el código (`app`, `public`, `resources`, `index.php`, etc.).

---

## PARTE 2 — Subir esa carpeta a GitHub (desde la PC)

### 1) Crear el repo vacío en GitHub
1. GitHub → **New repository**.
2. Nombre: `nombre-proyecto`.
3. **Sin** README (vacío).
4. Crea y copia la URL: `https://github.com/TU_USUARIO/nombre-proyecto.git`.

### 2) Primer push desde la PC

```bash title:En la PC — subir lo bajado de cPanel desc:Para qué: dejar el código en GitHub. Cuándo: ya descargaste el sitio a C:\proyectos\nombre-proyecto.
cd C:\proyectos\nombre-proyecto
git init
git add .
git commit -m "chore: respaldo inicial desde cPanel/produccion"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/nombre-proyecto.git
git push -u origin main
```

Si pide login: usa GitHub login / token (no pegues la clave del hosting).

### 3) SoftArc (recomendado)
En `/admin/projects` pega el `repoUrl` del GitHub en el proyecto del cliente.

---

## PARTE 3 — Bajarlo en la laptop desde GitHub

**Ya no uses FileZilla para pasar de PC a laptop.** Usa GitHub.

```bash title:En la laptop — clonar desc:Para qué: misma copia del proyecto. Cuándo: el push desde la PC ya terminó.
cd C:\proyectos
git clone https://github.com/TU_USUARIO/nombre-proyecto.git
cd nombre-proyecto
```

Si es Laravel / Node:

```bash title:Instalar deps en laptop desc:Para qué: poder abrir y correr en local. Cuándo: justo después del clone.
composer install
npm install
```

Abre en Cursor:

```bash title:Abrir en Cursor desc:Para qué: editar. Cuándo: ya clonaste.
cursor .
```

> Crea un `.env` local en la laptop (no copies el de producción a Git). Para producción sigue usando la bóveda SoftArc.

---

## Resumen en 3 frases
1. **cPanel/FileZilla → PC** (una vez).
2. **PC → GitHub** (`git push`).
3. **GitHub → laptop** (`git clone`).

Después: en cualquier máquina `git pull` → editas → `git push`. A producción otra vez con FileZilla cuando toque publicar.
MD;
    }

    private function commandGlossary(): string
    {
        return <<<'MD'
## Cómo usar esta guía
Cada bloque tiene **para qué sirve** y **cuándo usarlo**. Copia solo el comando que necesitas.

## Git — básicos

```bash title:git init desc:Para qué: crea un repo Git vacío en la carpeta actual. Cuándo: al empezar un proyecto local que aún no tiene control de versiones (o el bloque “crear repo” de GitHub).
git init
```

```bash title:git clone desc:Para qué: descarga un repo remoto a tu PC. Cuándo: la primera vez que vas a trabajar en un proyecto que ya está en GitHub.
git clone https://github.com/TU_USUARIO/TU_REPO.git
```

```bash title:git status desc:Para qué: muestra qué archivos cambiaron y si están listos para commit. Cuándo: antes de cada commit, para no subir basura.
git status
```

```bash title:git add desc:Para qué: prepara archivos para el próximo commit. Cuándo: después de editar y antes de git commit. Usa . para todo lo modificado.
git add .
```

```bash title:git commit desc:Para qué: guarda un “punto” del código con un mensaje. Cuándo: cuando un cambio ya tiene sentido (una feature o un fix).
git commit -m "feat: descripción clara"
```

```bash title:git branch -M main desc:Para qué: renombra la rama actual a main. Cuándo: al crear un repo nuevo, antes del primer push a GitHub.
git branch -M main
```

```bash title:git checkout -b desc:Para qué: crea una rama nueva y te cambia a ella. Cuándo: al empezar una feature o un fix separado de main.
git checkout -b feature/nombre-corto
```

```bash title:git remote add origin desc:Para qué: enlaza tu carpeta local con la URL de GitHub. Cuándo: la primera vez que conectas el proyecto (repo vacío en GitHub o proyecto ya existente en PC).
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
```

```bash title:git remote set-url origin desc:Para qué: cambia la URL del remoto si origin ya existía. Cuándo: si git remote add falla con “remote origin already exists”.
git remote set-url origin https://github.com/TU_USUARIO/TU_REPO.git
```

```bash title:git push -u origin main desc:Para qué: sube tu rama al remoto y la deja como tracking. Cuándo: primer push de main o de una rama nueva a GitHub.
git push -u origin main
```

```bash title:git pull desc:Para qué: trae y fusiona cambios del remoto. Cuándo: al empezar el día o antes de empujar, para no pisar trabajo de otros.
git pull origin main
```

## Laravel / Artisan

```bash title:composer create-project desc:Para qué: descarga Laravel limpio con su estructura. Cuándo: al crear un sistema PHP nuevo desde cero.
composer create-project laravel/laravel nombre-proyecto
```

```bash title:php artisan key:generate desc:Para qué: genera APP_KEY en el .env (cifrado de sesiones/cookies). Cuándo: justo después de copiar .env.example a .env.
php artisan key:generate
```

```bash title:php artisan migrate desc:Para qué: crea/actualiza tablas según migraciones. Cuándo: primera instalación o después de bajar cambios que traen migraciones nuevas.
php artisan migrate
```

```bash title:php artisan migrate:rollback desc:Para qué: deshace el último lote de migraciones. Cuándo: si una migración falló o quieres corregirla en local (con cuidado en producción).
php artisan migrate:rollback
```

```bash title:php artisan db:seed desc:Para qué: llena la BD con datos de ejemplo/configuración. Cuándo: tras migrate, o para refrescar wiki/roles demo.
php artisan db:seed
```

```bash title:php artisan serve desc:Para qué: levanta el servidor de desarrollo en localhost:8000. Cuándo: pruebas rápidas sin configurar VirtualHost en XAMPP.
php artisan serve
```

```bash title:php artisan optimize:clear desc:Para qué: limpia cachés de config, rutas y vistas. Cuándo: tras cambiar .env, rutas o si “no se ven” cambios en el servidor.
php artisan optimize:clear
```

```bash title:php artisan storage:link desc:Para qué: enlaza storage/app/public → public/storage. Cuándo: la primera vez que vas a servir archivos subidos (logos, media).
php artisan storage:link
```

## npm / front

```bash title:npm install desc:Para qué: instala dependencias de package.json. Cuándo: al clonar un proyecto o después de agregar paquetes al package.json.
npm install
```

```bash title:npm run dev desc:Para qué: servidor de desarrollo Vite con recarga en vivo. Cuándo: mientras editas React/CSS en local.
npm run dev
```

```bash title:npm run build desc:Para qué: genera assets listos para producción en public/build. Cuándo: antes de subir el front al hosting.
npm run build
```

```bash title:npm create vite desc:Para qué: crea un proyecto React/Vite vacío. Cuándo: al pasar un prototipo de AI Studio a Cursor, o un front nuevo.
npm create vite@latest mi-app -- --template react-ts
```
MD;
    }

    private function laravelCreate(): string
    {
        return <<<'MD'
## Objetivo
Levantar un proyecto Laravel en local (XAMPP / PHP) listo para MySQL y Vite.

## Requisitos
- PHP 8.2+ y Composer
- MySQL (XAMPP)
- Node.js (para el front Vite)

## 1) Crear el proyecto

```bash title:Crear con Composer desc:Para qué: genera la carpeta del proyecto Laravel. Cuándo: empiezas un sistema nuevo y la carpeta aún no existe.
composer create-project laravel/laravel nombre-proyecto
cd nombre-proyecto
```

## 2) Base de datos
1. Crea la BD en phpMyAdmin (ej. `nombre_proyecto`).
2. Copia `.env.example` a `.env` y ajusta.

```bash title:Copiar .env y generar key desc:Para qué: crea tu configuración local y la clave de app. Cuándo: inmediatamente después de create-project, antes de migrate.
copy .env.example .env
php artisan key:generate
```

```env title:Fragmento .env MySQL (XAMPP) desc:Para qué: conecta Laravel a MySQL de XAMPP. Cuándo: al configurar el proyecto la primera vez (usuario root sin clave es típico en local).
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nombre_proyecto
DB_USERNAME=root
DB_PASSWORD=
```

## 3) Migrar e instalar front

```bash title:Migraciones + npm desc:Para qué: crea tablas e instala/compila el front. Cuándo: con el .env ya apuntando a tu BD.
php artisan migrate
npm install
npm run build
```

## 4) Servir en local

```bash title:Servidor Laravel desc:Para qué: abre http://127.0.0.1:8000 sin tocar Apache. Cuándo: pruebas rápidas; en SoftArc/XAMPP también puedes usar el alias a public/.
php artisan serve
```

> Si usas XAMPP como SoftArc, puedes apuntar el DocumentRoot / alias a `public/` en lugar de `artisan serve`.

## Estructura mínima a recordar
- `app/` → lógica PHP
- `routes/web.php` y `routes/api.php` → rutas
- `resources/js` → front (Vite/React)
- `public/` → punto de entrada web
MD;
    }

    private function laravelArtisan(): string
    {
        return <<<'MD'
## Controllers, models y migraciones

```bash title:Crear modelo + migración + factory + seeder desc:Para qué: genera de una vez el model Eloquent y archivos relacionados. Cuándo: vas a crear una tabla nueva (productos, tickets, etc.).
php artisan make:model Producto -mfs
```

```bash title:Solo controlador API desc:Para qué: esqueleto REST (index/store/update…). Cuándo: expones endpoints JSON para el admin/SPA.
php artisan make:controller Api/ProductoController --api
```

```bash title:Migración suelta desc:Para qué: crea solo el archivo de migración. Cuándo: alteras una tabla existente sin un model nuevo.
php artisan make:migration create_productos_table
```

## Base de datos

```bash title:Correr migraciones desc:Para qué: aplica pendientes en la BD. Cuándo: tras pull o al instalar el proyecto.
php artisan migrate
```

```bash title:Rollback último lote desc:Para qué: revierte el último migrate. Cuándo: en local, si acabas de romper una migración.
php artisan migrate:rollback
```

```bash title:Seeders desc:Para qué: inserta datos base (roles, wiki, demos). Cuándo: después de migrate o para refrescar contenido de ejemplo.
php artisan db:seed
php artisan db:seed --class=WikiDevGuidesSeeder
```

## Caché y rutas (útil en producción)

```bash title:Limpiar cachés desc:Para qué: fuerza a Laravel a releer config/rutas/vistas. Cuándo: cambiaste .env o “no se refleja” un cambio en el servidor.
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

```bash title:Ver rutas desc:Para qué: lista todas las URLs registradas. Cuándo: una ruta 404 o no sabes el nombre exacto del endpoint.
php artisan route:list
```

## Storage y links

```bash title:Link storage → public desc:Para qué: hace públicos los archivos de storage. Cuándo: primera vez que subes logos/medios y no se ven en el navegador.
php artisan storage:link
```
MD;
    }

    private function aiStudioToCursor(): string
    {
        return <<<'MD'
## Objetivo
Llevar un prototipo de **Google AI Studio** a un proyecto editable en **Cursor** (React + TypeScript).

## Flujo recomendado
1. En AI Studio, genera o abre tu app React.
2. Copia el código o descarga el ZIP.
3. Crea un proyecto Vite limpio en tu PC.
4. Ábrelo en Cursor y pega / adapta el código.
5. Instala dependencias que falten y corre en local.

## 1) Crear el contenedor en local

```bash title:Vite + React + TypeScript desc:Para qué: crea la carpeta del proyecto con React y TS. Cuándo: antes de pegar el código de AI Studio (mejor base limpia que pelear con el ZIP crudo).
npm create vite@latest mi-app-ai -- --template react-ts
cd mi-app-ai
npm install
```

## 2) Abrir en Cursor

```bash title:Abrir carpeta en Cursor (CLI) desc:Para qué: abre el proyecto actual en Cursor. Cuándo: ya estás en la carpeta del proyecto en la terminal.
cursor .
```

> Si no tienes el CLI: File → Open Folder y elige `mi-app-ai`.

## 3) Pegar el código de AI Studio
1. Fusiona `src/App.tsx` con el de AI Studio.
2. Copia componentes a `src/components/`.
3. Instala libs que falten.
4. Ajusta imports y assets en `/public`.

```bash title:Tailwind desc:Para qué: utilidades CSS del prototipo. Cuándo: AI Studio generó clases tipo bg-*, flex, etc.
npm install -D tailwindcss @tailwindcss/vite
```

```bash title:Iconos Lucide desc:Para qué: set de iconos SVG. Cuándo: el prototipo importa lucide-react.
npm install lucide-react
```

```bash title:Router desc:Para qué: varias pantallas / URLs. Cuándo: hay más de una vista (login, dashboard…).
npm install react-router-dom
```

## 4) Correr y verificar

```bash title:Dev server desc:Para qué: vista previa en el navegador con hot reload. Cuándo: mientras adaptas el código en Cursor.
npm run dev
```

## 5) Subir a GitHub (opcional)

```bash title:Primer commit a GitHub desc:Para qué: versiona y publica el proyecto. Cuándo: ya corre en local y quieres respaldo remoto.
git init
git add .
git commit -m "feat: importar prototipo desde AI Studio a Cursor"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/mi-app-ai.git
git push -u origin main
```

## Checklist rápido
- [ ] Abre en Cursor sin errores graves de TypeScript
- [ ] `npm run dev` muestra la UI
- [ ] Dependencias están en `package.json`
- [ ] Sin API keys en el código (usa `.env`)
MD;
    }

    private function reactVite(): string
    {
        return <<<'MD'
## Crear app

```bash title:Plantilla oficial desc:Para qué: scaffolding React+TS con Vite. Cuándo: front nuevo o base para traer código de AI Studio.
npm create vite@latest nombre-app -- --template react-ts
cd nombre-app
npm install
npm run dev
```

## Scripts útiles

```json title:package.json (referencia) desc:Para qué: recuerda qué hace cada script. Cuándo: dudas entre dev / build / preview.
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  }
}
```

- `dev` → desarrollo diario
- `build` → antes de subir a hosting
- `preview` → probar el build en local

## Integrar con Laravel (como SoftArc)
1. El front vive en `resources/js`.
2. Vite publica a `public/build`.
3. En desarrollo: `npm run dev` + Laravel.
4. En producción: `npm run build` y subir `public/build`.

```bash title:Build de producción desc:Para qué: genera JS/CSS minificados. Cuándo: despliegue o antes de FileZilla/Git en el servidor.
npm run build
```
MD;
    }

    private function commits(): string
    {
        return <<<'MD'
## Convención corta — cuándo usar cada prefijo
- `feat:` → nueva función visible para el usuario
- `fix:` → corregir un bug
- `docs:` → solo documentación / wiki
- `refactor:` → mejorar código sin cambiar lo que hace
- `style:` → UI/CSS, sin lógica nueva
- `chore:` → deps, configs, limpieza
- `perf:` → rendimiento

## Listos para copiar

```text title:Features desc:Para qué: mensajes cuando agregas algo nuevo. Cuándo: módulo, pantalla o integración terminada.
feat: agregar módulo de clientes
feat: conectar bóveda de credenciales
feat: exportar reporte de facturación
feat: modo claro/oscuro en admin
```

```text title:Fixes desc:Para qué: mensajes de corrección. Cuándo: reparaste un error reportado o visual.
fix: corregir botones del modal sin estilos
fix: restaurar buscador del admin
fix: evitar rate limit en API de medios
fix: alinear logos en header y footer
```

```text title:Docs y chore desc:Para qué: docs y mantenimiento. Cuándo: actualizaste la wiki o dependencias sin feature nueva.
docs: actualizar guía de deploy FileZilla
docs: agregar wiki Laravel y Cursor
chore: actualizar dependencias npm
chore: limpiar assets de branding
```

```text title:Refactor / UI desc:Para qué: limpieza o estilo. Cuándo: no hay bug ni feature, solo orden o look.
refactor: unificar FormModal y DetailModal
style: reorganizar índice de la wiki por bloques
perf: prefetch de rutas del admin
```

## Tip SoftArc
Un commit = un cambio entendible. Evita “varios arreglos” sin detalle.
MD;
    }

    private function gitFlow(): string
    {
        return <<<'MD'
## Clonar y entrar

```bash title:Clonar repo desc:Para qué: copia el proyecto de GitHub a tu disco. Cuándo: primera vez que entras al equipo o a un repo.
git clone https://github.com/TU_ORG/softarc.git
cd softarc
```

## Rama de trabajo

```bash title:Crear y cambiar de rama desc:Para qué: aísla tu trabajo de main. Cuándo: empiezas una tarea (feature/fix) que subirás en un PR o push aparte.
git checkout -b feature/nombre-corto
```

## Guardar cambios

```bash title:Status + add + commit desc:Para qué: revisa, prepara y guarda el punto. Cuándo: terminaste un cambio coherente y quieres registrarlo.
git status
git add .
git commit -m "feat: descripción clara del cambio"
```

## Subir

```bash title:Push de la rama desc:Para qué: publica tu rama en GitHub. Cuándo: quieres respaldo remoto o abrir un pull request.
git push -u origin feature/nombre-corto
```

## Actualizar desde main

```bash title:Traer main y fusionar desc:Para qué: pone tu rama al día con lo último de main. Cuándo: main avanzó y vas a seguir trabajando o antes de un PR.
git checkout main
git pull origin main
git checkout feature/nombre-corto
git merge main
```

> Nunca subas `.env`, claves ni dumps con datos reales a GitHub.
MD;
    }

    private function githubNewOrExisting(): string
    {
        return <<<'MD'
## Qué es esto
Son los bloques que muestra GitHub al crear un repo vacío.

> Cambia `TU_USUARIO` / `TU_REPO` (ej. `aldair210902` / `etnabsa`).

## Crear un nuevo repositorio en la línea de comandos

```bash title:Crear repo nuevo desde cero desc:Para qué: inicia Git, hace el primer commit y lo sube a GitHub. Cuándo: el repo en GitHub está vacío y en tu PC aún no hay git init.
echo "# TU_REPO" >> README.md
git init
git add README.md
git commit -m "primer commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### Qué hace cada línea
- `echo … README.md` → crea un archivo inicial
- `git init` → activa Git en la carpeta
- `git add` / `commit` → primer guardado
- `git branch -M main` → rama principal llamada main
- `git remote add origin` → enlaza con GitHub
- `git push -u origin main` → sube y configura tracking

## Actualizar / conectar un repositorio existente

```bash title:Conectar proyecto que ya tienes desc:Para qué: enlaza y sube un proyecto local que ya tiene archivos (y suele tener git). Cuándo: GitHub está vacío pero tu carpeta local ya es el proyecto.
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

## Ejemplo real (etnabsa)

```bash title:Nuevo repo — ejemplo etnabsa desc:Para qué: mismo flujo con tu URL real. Cuándo: estás creando etnabsa por primera vez desde una carpeta vacía.
echo "# etnabsa" >> README.md
git init
git add README.md
git commit -m "primer commit"
git branch -M main
git remote add origin https://github.com/aldair210902/etnabsa.git
git push -u origin main
```

```bash title:Repo existente — ejemplo etnabsa desc:Para qué: subir etnabsa si el código ya está en tu PC. Cuándo: ya trabajaste local y solo falta enlazar GitHub.
git remote add origin https://github.com/aldair210902/etnabsa.git
git branch -M main
git push -u origin main
```

## Si `git remote add` falla

```bash title:Ver y cambiar origin desc:Para qué: corrige la URL si origin ya existía. Cuándo: el error dice “remote origin already exists”.
git remote -v
git remote set-url origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```
MD;
    }

    private function libraries(): string
    {
        return <<<'MD'
## Laravel (Composer)

```bash title:Paquetes frecuentes SoftArc-like desc:Para qué: auth API (Sanctum) e imágenes. Cuándo: API con tokens o subida/procesado de media.
composer require laravel/sanctum
composer require intervention/image
```

```bash title:Dev (opcional) desc:Para qué: formato de código y errores más claros. Cuándo: solo en desarrollo, no hace falta en producción.
composer require --dev laravel/pint
composer require --dev nunomaduro/collision
```

## Front (npm) — admin / SPA

```bash title:UI y utilidades desc:Para qué: iconos, classNames y rutas del SPA. Cuándo: montas el admin React como SoftArc.
npm install lucide-react clsx tailwind-merge
npm install react-router-dom
```

```bash title:Gráficos (reportes) desc:Para qué: charts en dashboards. Cuándo: módulo de reportes/finanzas.
npm install recharts
```

```bash title:Vite + React (si partes de cero) desc:Para qué: runtime y toolchain del front. Cuándo: proyecto front nuevo fuera de Laravel.
npm install react react-dom
npm install -D vite @vitejs/plugin-react typescript
```

## Cheat sheet de versiones
1. Revisa `composer.json` / `package.json` antes de instalar “lo último”.
2. Tras instalar: `composer dump-autoload` o `npm run build`.
3. Anota en la wiki por qué añadiste el paquete.

```bash title:Ver qué tienes instalado desc:Para qué: lista paquetes actuales. Cuándo: dudas si ya está instalado o qué versión usas.
composer show --installed
npm ls --depth=0
```
MD;
    }
}
