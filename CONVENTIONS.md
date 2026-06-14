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

## 4. Diseño Responsivo y Breakpoints (Mobile-First)
*   **Checklist de Pruebas Obligatorio:** Todo componente nuevo o modificado debe ser verificado en los siguientes anchos de viewport:
    *   `320px` (Mínimo soportado, ej. iPhone SE antiguo)
    *   `375px` (Móvil promedio estándar)
    *   `414px` (Móvil grande)
    *   `768px` (Tablet Portrait / `md:`)
    *   `1024px` (Tablet Landscape o Desktop pequeño / `lg:`)
*   **Regla de Desbordamiento:** NINGÚN elemento puede causar scroll horizontal de la página completa. El layout raíz debe tener `overflow-x-hidden` como red de seguridad. Si se requiere scroll horizontal (ej. Carrusel o Kanban), debe usarse `overflow-x-auto`, un ancho máximo de `100%` o `100vw`, y preferiblemente `scroll-snap-type: x mandatory` contenido *dentro* de su propio componente.
*   **Grillas (Grids):**
    *   Por defecto en móvil (`<640px`), las grillas pesadas con mucho texto deben usar `grid-cols-1`.
    *   Solo se permite `grid-cols-2` en móvil si el contenido está garantizado a no truncarse y caber en ~140px por columna.
*   **Safe Area:** En mobile, el padding inferior global debe prever el `env(safe-area-inset-bottom)` de los dispositivos sin botones físicos.
