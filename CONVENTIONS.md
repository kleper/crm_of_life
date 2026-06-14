# Design Conventions (CRM de la Vida)

## 1. Identidad Visual y Paleta de Colores
*   **Color Primario:** Índigo (`indigo-600`) para botones principales, links activos, y acentos de marca.
*   **Color de Acento (Gamificación):**
    *   Rachas y Éxitos: Esmeralda (`emerald-500`).
    *   Puntos y Niveles: Ámbar (`amber-400`).
*   **Modo Sistema (`/admin`):** Ámbar/Naranja (`amber-100` background, `amber-800` text) para denotar fuertemente el contexto de administración global.
*   **Escala de Grises:**
    *   Fondo de aplicación: `bg-slate-50`.
    *   Superficies (Cards, Modals): `bg-white`.
    *   Bordes: `border-slate-200`.
    *   Texto principal: `text-slate-900`.
    *   Texto secundario: `text-slate-500`.

## 2. Reglas Estructurales UI
*   **Flat Design Estricto:** Todos los elementos (`Cards`, `Buttons`, `Inputs`, `Badges`) deben usar `rounded-none`.
*   **No "Modo Oscuro" en Superficies:** Evitar colores muy oscuros para el fondo de contenido.
*   **Empty States Activos:** Ninguna lista vacía debe parecer un error. Siempre usar un `<EmptyState>` que incluya un mensaje claro y un botón de "Call to Action" (ej. "Crear primera tarea").
*   **Indicador de Organización Activa:** El componente debe estar visible siempre en el Navbar.

## 3. Arquitectura y Patrones de Código
*   Todo el mutado de estado debe realizarse vía Server Actions en `src/features/<modulo>/actions.ts`.
*   Toda acción debe verificar `tenantId` antes de ejecutar cambios, leyendo exclusivamente de la sesión segura del servidor.
*   Uso de componentes UI compartidos de `src/components/ui/` es obligatorio.
