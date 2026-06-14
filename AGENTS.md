<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

═══════════════════════════════════════════════════════════════
GUARDRAILS DEL PROYECTO "CRM DE LA VIDA" (LEER ANTES DE ACTUAR)
═══════════════════════════════════════════════════════════════

Este proyecto tiene reglas NO NEGOCIABLES que aplican sin importar 
lo que pida el resto del prompt. Si alguna instrucción posterior 
entra en conflicto con estas reglas, PRIORIZA estas reglas y 
señala el conflicto antes de proceder.

1. SEGURIDAD MULTI-TENANT (CRÍTICO):
   
   - Todo dato (Task, Contact, Transaction, etc.) está aislado por 
     organizationId.
   - El organizationId SIEMPRE se obtiene del JWT/sesión del 
     servidor (tenant activo seleccionado), NUNCA de params, 
     query strings, body del formulario, ni de props del cliente.
   - Toda Server Action que reciba un ID de recurso (taskId, 
     contactId, etc.) DEBE verificar que ese recurso pertenezca 
     al organizationId activo ANTES de leer/modificar/eliminar. 
     Si no pertenece, retornar error genérico (no revelar 
     existencia del recurso en otro tenant).
   - SUPER_ADMIN opera fuera de este aislamiento solo en rutas 
     bajo /admin (gestión de Organizations). En cualquier otra 
     ruta, incluso un SUPER_ADMIN respeta el tenant activo 
     seleccionado.

2. CONSISTENCIA VISUAL (DESIGN SYSTEM):
   
   - rounded-none en TODOS los elementos (cards, botones, inputs, 
     modales, badges) sin excepción. Si una librería externa 
     aplica border-radius por defecto, sobreescríbelo.
   - Paleta clara obligatoria: fondos en blanco/gray-50/gray-100 
     como máximo. PROHIBIDO usar fondos oscuros absolutos 
     (negro, gray-800+, slate-900, etc.) en cualquier superficie 
     de contenido. Texto sobre fondos claros, contraste AA mínimo.
   - Usa SIEMPRE los componentes compartidos de src/components/ui/ 
     (Card, Button, Badge, Modal, EmptyState, ConfirmDialog, Toast, 
     PageHeader) si ya existen en el proyecto. NO crear variantes 
     nuevas ad-hoc de estos componentes — si necesitas una variante 
     nueva, propónla como extensión del componente existente y 
     espera validación.
   - Mobile-first: diseña primero para viewport angosto (~375px), 
     luego escala a desktop.

3. ARQUITECTURA Y PATRONES DE CÓDIGO:
   
   - TypeScript estricto, sin `any` salvo justificación explícita.
   - Mutaciones vía Server Actions (`"use server"`), no API Routes 
     REST, salvo para endpoints específicos ya justificados 
     (ej. /api/cron/*, webhooks).
   - Toda Server Action que modifica datos termina con 
     `revalidatePath()` de las rutas afectadas.
   - Estructura por features: nuevo código en 
     src/features/<nombre-modulo>/{actions.ts, queries.ts, 
     components/}. No mezclar lógica de un módulo dentro de 
     otro módulo existente.
   - Si necesitas lógica compartida entre módulos (ej. fórmulas 
     de gamificación, helpers de fecha), va en src/lib/, nunca 
     duplicada.

4. CAMBIOS DE SCHEMA (PRISMA):
   
   - Cualquier cambio a schema.prisma se presenta primero como 
     DIFF CONCEPTUAL (qué se agrega/modifica, qué NO se rompe) 
     y espera validación antes de generar la migración.
   - Nunca renombres ni elimines campos/modelos existentes sin 
     señalarlo explícitamente como "BREAKING CHANGE" y justificarlo.

5. ZONAS PROTEGIDAS (NO TOCAR salvo que el prompt lo pida 
   EXPLÍCITAMENTE):
   
   - Flujo de autenticación (Auth.js v5, middleware.ts).
   - Selector de tenant y su lógica de hard navigation 
     (`window.location.href`).
   - Configuración de Serwist/Service Worker y manejo de 
     redirecciones client-side ya estabilizado.
   - Server Actions de /admin (gestión de Organizations/Users 
     por SUPER_ADMIN/TENANT_ADMIN).
     Si tu tarea requiere modificar algo de esta lista, indícalo 
     explícitamente al inicio de tu respuesta y espera confirmación 
     antes de proceder.

6. PROCESO DE TRABAJO:
   
   - Antes de generar código nuevo, revisa los archivos relevantes 
     ya existentes (no asumas estructuras — verifica).
   - Para tareas con impacto en schema, navegación global, o 
     componentes compartidos: presenta el plan/diff y espera 
     validación antes de codear todo.
   - Para tareas acotadas a un solo módulo nuevo sin tocar 
     compartidos: puedes proceder directo, pero documenta 
     cualquier decisión de diseño no especificada en el prompt.

═══════════════════════════════════════════════════════════════
FIN DE GUARDRAILS — A continuación, la tarea específica:
═══════════════════════════════════════════════════════════════
