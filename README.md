# CRM de la Vida

**CRM de la Vida** es una aplicación web PWA avanzada diseñada para gestionar el día a día personal y profesional como un CRM, incorporando gamificación, tareas, proyectos y finanzas. Destaca por su arquitectura **Multi-Tenant (Multi-Organización)** orientada a la escalabilidad B2B/B2C, un sistema robusto de permisos (RBAC) y una interfaz de usuario completamente "plana" (sin bordes redondeados) diseñada para ser limpia y libre de distracciones.

---

## 🛠 Stack Tecnológico Detallado

- **Framework Principal**: Next.js 15+ (App Router).
- **Lenguaje**: TypeScript estricto.
- **Frontend & Estilos**: React 19, Tailwind CSS v4. Uso estricto de diseño plano (`rounded-none`).
- **Autenticación**: Auth.js (NextAuth) v5 usando el adaptador de Prisma y estrategia de sesión basada en JWT (JSON Web Tokens).
- **Base de Datos**: PostgreSQL 18.
- **ORM**: Prisma (con `prisma/client` y `@auth/prisma-adapter`).
- **PWA (Progressive Web App)**: Serwist para inyección de Service Workers y cacheo inteligente offline/online.
- **Contenedores y Despliegue**: Docker y Docker Compose usando el modo de salida `standalone` de Next.js para optimizar la imagen final a producción.

---

## 🔒 Arquitectura de Autenticación y RBAC

El sistema utiliza un control de acceso basado en roles (Role-Based Access Control) distribuido y escalable.

### 1. Modelado de Roles
La estructura de base de datos define tres entidades primordiales en el flujo de seguridad:
- **User**: Cada usuario tiene credenciales de acceso globales y una bandera única booleana `isSuperAdmin`.
- **Tenant (Organización)**: Espacios de trabajo aislados entre sí.
- **TenantUser**: Tabla pivote que conecta usuarios con organizaciones y define el `Role` específico (`TENANT_ADMIN` o `USER`) que ejerce ese usuario *dentro* de ese entorno.

### 2. Flujo de Autenticación (Auth.js v5)
1. El usuario inicia sesión a través del `CredentialsProvider`. Las contraseñas son validadas contra hashes seguros de `bcryptjs`.
2. Durante el inicio de sesión, el callback `jwt` de NextAuth inyecta en el Token tanto el estado de Súper Administrador como la lista inicial de Organizaciones (`tenants`) a las que pertenece.
3. El `middleware.ts` en la raíz de la aplicación intercepta de manera Edge todas las peticiones a rutas protegidas (a excepción de los recursos estáticos, iconos y el `manifest.json`), validando la existencia de la cookie JWT. Si no existe, lanza un `HTTP 307 Redirect` hacia `/login`.

---

## 🏢 Multi-Tenant: Selección y Persistencia de Sesión

Para prevenir bloqueos de caché en Next.js (App Router) al cambiar de una organización a otra, se implementa el siguiente flujo técnico:

1. **Lectura Dinámica**: Al acceder a la ruta `/select-tenant`, un componente servidor consulta **directamente a PostgreSQL vía Prisma** (`prisma.tenantUser.findMany`) los Tenants activos del usuario. Esto asegura que si el Súper Admin le acaba de otorgar acceso a un nuevo espacio, el usuario lo verá inmediatamente, ignorando cualquier `Session` JWT que haya quedado desactualizada.
2. **Actualización del JWT Client-Side**: Al seleccionar el entorno, la función `update()` de `next-auth/react` sobreescribe la cookie de sesión insertando el `selectedTenantId` y `selectedTenantRole` para uso inmediato.
3. **Hard Navigation**: En lugar de utilizar `router.push()` (que podría causar una navegación "suave" cacheada), se lanza un `window.location.href = "/tasks"` forzando al motor de Next.js a re-leer el nuevo JWT en la solicitud inicial al servidor.

### Flujos de Administración (UI)
- **El Súper Admin**: Tiene acceso irrestricto a `/admin`. Desde aquí puede crear Organizaciones nuevas y automáticamente asigna credenciales al "Administrador" de dicha organización. 
- **El Admin del Tenant (TENANT_ADMIN)**: Entra a su organización. En el *Global Navbar*, el sistema lee su rol y le dibuja dinámicamente el botón de "Panel de Administración". Al ingresar, el Admin del Tenant ve la ruta `/admin/users` donde puede crear e invitar a nuevos empleados o participantes (asignándoles el rol de `USER` o `TENANT_ADMIN`), pero **no** puede acceder al CRUD general de organizaciones.

---

## ⚡ Server Actions e Integración de Backend

El código está exento de APIs REST tradicionales para los envíos de formularios. Todo el CRUD (Crear, Editar, Eliminar) se procesa a través de **Server Actions** (`"use server"`) alojados en `src/app/admin/actions.ts`:
- Emplean la función `revalidatePath` de Next.js.
- Cuando un Admin de Organización crea un usuario, la Server Action verifica silenciosamente el JWT de quien ejecuta la acción, compara que posea `TENANT_ADMIN` y asegura criptográficamente que no esté intentando inyectar un usuario en el `tenantId` de otra empresa.

---

## 🚀 Despliegue en Producción (Guía Paso a Paso)

El sistema está diseñado para ser desplegado fácilmente en cualquier servidor virtual (VPS como DigitalOcean, AWS EC2, Linode, etc.) utilizando **Docker** y **Docker Compose**.

### Prerrequisitos del Servidor
- Servidor Linux (Ubuntu 22.04 / 24.04 recomendado)
- [Docker](https://docs.docker.com/engine/install/) y [Docker Compose](https://docs.docker.com/compose/install/) instalados
- Dominio apuntando a la IP de tu servidor (para configuración de SSL/HTTPS, se recomienda un proxy inverso como Nginx o Traefik, aunque no está incluido por defecto).

### 1. Clonar el Repositorio
Ingresa a tu servidor por SSH y clona el proyecto:
```bash
git clone https://github.com/tu-usuario/crm_of_life.git
cd crm_of_life
```

### 2. Configurar Variables de Entorno
Copia el archivo de ejemplo para crear tus variables reales:
```bash
cp .env.example .env
```
Abre el archivo `.env` (`nano .env`) y personaliza las variables importantes. A continuación se presentan comandos útiles en Linux para generar contraseñas seguras y llaves criptográficas requeridas en el archivo:

#### Base de Datos
- **`DATABASE_URL`**: Por defecto usa `postgres:postgres`. Para cambiar la contraseña de la base de datos a algo seguro, puedes generar un password con:
  ```bash
  openssl rand -base64 16
  ```
  *(Nota: Si cambias la contraseña en `DATABASE_URL`, asegúrate de actualizarla también en tu `docker-compose.yml` si levantas PostgreSQL desde ahí).*

#### Credenciales
- **`INITIAL_SUPERADMIN_EMAIL`** y **`INITIAL_SUPERADMIN_PASSWORD`**: Credenciales de tu usuario principal. Puedes generar una contraseña fuerte con:
  ```bash
  openssl rand -base64 12
  ```

#### Secretos de Aplicación
- **`AUTH_SECRET`**: Secreto usado por Auth.js (NextAuth) para encriptar los JWT. Genera uno con:
  ```bash
  openssl rand -base64 32
  ```
- **`CRON_SECRET`**: Contraseña aleatoria para proteger los endpoints que ejecutan tareas automáticas (cron). Puedes generar una igual que arriba:
  ```bash
  openssl rand -hex 32
  ```

#### Llaves para Notificaciones Push (VAPID)
Para que funcionen las notificaciones en el navegador, debes generar un par de llaves pública y privada (VAPID). Si tienes Node instalado en tu servidor, ejecuta:
```bash
npx web-push generate-vapid-keys
```
Copia el resultado en `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`.

#### Dominio
- **`NEXT_PUBLIC_APP_URL`**: La URL pública donde vivirá tu aplicación (ej. `https://crm.tudominio.com`). No olvides cambiarla para que el Service Worker y OAuth funcionen correctamente.

### 3. Levantar la Infraestructura (Docker)
Inicia los contenedores (PostgreSQL + Servidor Next.js). La primera vez, esto descargará las imágenes y compilará la aplicación.
```bash
sudo docker compose up --build -d
```

### 4. Configurar la Base de Datos
Una vez que los contenedores estén corriendo, debes inyectar la estructura de la base de datos (schema) y crear tu Súper Administrador.

```bash
# Sincronizar el esquema de Prisma con la base de datos
sudo docker exec -it crm_of_life-app-1 sh -c "node node_modules/prisma/build/index.js migrate deploy"

# Ejecutar el Seed inicial (Crea el super administrador usando el .env)
sudo docker exec -it crm_of_life-app-1 sh -c "npx --yes tsx prisma/seed.ts"
```

### 5. Configurar Tareas Automáticas (Cron Jobs)
El CRM depende de tareas en segundo plano para generar recordatorios y crear tareas recurrentes automáticamente. Dado que Next.js no tiene un demonio de cron incorporado de forma nativa, debes usar el crontab de tu servidor Linux para llamar a las APIs protegidas de tu app.

Abre el crontab en tu servidor:
```bash
crontab -e
```
Agrega estas dos líneas (reemplaza las URLs por tu dominio y coloca el `CRON_SECRET` que definiste en el `.env`):
```cron
# Generar tareas recurrentes cada día a las 05:00 AM
0 5 * * * curl -X GET "http://localhost:3000/api/cron/generate-recurring-tasks" -H "Authorization: Bearer TU_CRON_SECRET"

# Enviar notificaciones push de recordatorios cada día a las 08:00 AM
0 8 * * * curl -X GET "http://localhost:3000/api/cron/check-reminders" -H "Authorization: Bearer TU_CRON_SECRET"
```

### 6. ¡Listo!
Ingresa a tu dominio o IP pública por el puerto `3000` (ej. `http://tu-ip:3000`).
Inicia sesión con el correo y contraseña que configuraste en `INITIAL_SUPERADMIN_PASSWORD`. Al entrar, verás el panel `/admin` para crear la primera Organización y empezar a invitar a tu equipo.

---

> **Nota sobre HTTPS / PWA**: Las notificaciones Push y la instalación de PWA (Service Workers) requieren de un contexto seguro (`HTTPS`). En producción, se recomienda enfáticamente colocar la aplicación detrás de un servidor proxy como Caddy, Nginx Proxy Manager o Traefik que gestione automáticamente los certificados SSL Let's Encrypt apuntando al puerto `3000` del contenedor.
