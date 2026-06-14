# Checklist de Pruebas: PWA, Sesión Persistente y Notificaciones (iOS / Android)

Este documento describe cómo probar la confiabilidad de la sesión y las notificaciones Web Push, especialmente considerando las restricciones estrictas de iOS Safari (Intelligent Tracking Prevention) y los ciclos de vida de la Progressive Web App (PWA) instalada.

## Parte 1: Pruebas de Sesión (Auth.js v5 con JWT manual expiration)

La sesión ahora está controlada por una cookie `httpOnly` basada en JWT.

### 1.1 Prueba de "Recordarme" (Persistencia Larga)
- [ ] Entra a la URL pública del proyecto desde Safari en iOS (o Chrome en Android).
- [ ] Inicia sesión marcando la casilla **"Recordarme en este dispositivo"**.
- [ ] Instala la PWA: "Agregar a la pantalla de inicio".
- [ ] Abre la PWA instalada y verifica que la sesión esté activa sin volver a pedir login.
- [ ] **Simulación de ITP (Purga de LocalStorage):** En Safari, ve a Ajustes > Safari > Avanzado > Datos de sitios web, y elimina los datos de tu dominio, **PERO NO** borres las cookies (si es posible separarlo), o simplemente usa el inspector de Safari conectado al Mac y borra `localStorage` manualmente.
- [ ] Recarga la PWA. **Resultado esperado:** Sigues logueado. (Auth.js usa una cookie HttpOnly que no es afectada por el borrado de LocalStorage, y configuramos `maxAge` de 90 días).
- [ ] **Cierra la PWA** del App Switcher (desliza hacia arriba), espera unos minutos, y vuelve a abrirla. Sigues logueado.

### 1.2 Prueba de Sesión Corta (Sin "Recordarme")
- [ ] Cierra sesión desde el menú principal.
- [ ] Inicia sesión **DESMARCANDO** la casilla "Recordarme".
- [ ] Navega por la app normalmente.
- [ ] **Simulación de paso del tiempo:** En tu servidor de desarrollo o cambiando el reloj de tu dispositivo, adelanta el reloj 25 horas.
- [ ] Recarga la página. **Resultado esperado:** Auth.js debería expulsarte al login, ya que inyectamos `expiresAt = Date.now() + 24h` dentro del JWT manualmente.

---

## Parte 2: Pruebas de Notificaciones Push (Guardian y 410 Gone)

iOS a veces purga silenciosamente los registros de `PushSubscription` si la PWA no se abre frecuentemente. 

### 2.1 Suscripción Inicial y Guardian
- [ ] Inicia sesión en la PWA en iOS/Android.
- [ ] Ve a `/settings/notifications`. 
- [ ] Haz clic en **"Habilitar"** (si aparece). Otorga permisos del sistema.
- [ ] Verifica que el indicador diga "Permitido" y "Suscripciones activas registradas: X" (al menos 1).
- [ ] **Prueba de "Guardian":** Conecta tu dispositivo al inspector de Safari (Mac). En la consola, ejecuta: `navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription().then(sub => sub.unsubscribe()))`. (Simulamos la purga).
- [ ] Navega a cualquier página y vuelve a entrar a la PWA. El componente `<PushSubscriptionGuardian>` en el layout detectará que `Notification.permission` es 'granted' pero falta la suscripción.
- [ ] **Resultado esperado:** Aparecerá un banner inferior amarillo indicando "Conexión de notificaciones interrumpida", con un botón de "Reconectar" para forzar el registro (ya que Safari requiere un gesto del usuario `onClick` para suscribirse de nuevo).
- [ ] Haz clic en "Reconectar". El banner desaparecerá.

### 2.2 Limpieza Automática de BD (410 Gone / 404)
El servidor ahora centraliza las notificaciones con `sendPushToUser()`, atrapando errores cuando un endpoint muere.

- [ ] Entra a tu base de datos y edita una de tus `PushSubscription`. Modifica la URL del `endpoint` (ponle un string basura al final) simulando que el endpoint caducó.
- [ ] Asígnate una tarea (lo que dispara una push notification).
- [ ] En los logs de la terminal del servidor (Docker), deberás ver:
  `Eliminando PushSubscription muerta para el usuario X (endpoint: ...)`
- [ ] Revisa la base de datos. Esa suscripción corrupta debió desaparecer automáticamente, evitando intentos de envío futuros en el Cron.

### 2.3 Notificaciones Recurrentes (Cron)
- [ ] Crea una tarea con fecha de vencimiento hoy, asignada a ti.
- [ ] Ejecuta el cron manualmente desde tu servidor o terminal local: `curl http://localhost:3000/api/cron/check-reminders` (Si estás en dev).
- [ ] Verifica que recibes la push en tu dispositivo (iOS/Android).

---

## Notas de Compatibilidad y Diagnóstico
1. **iOS < 16.4:** No soporta Web Push en lo absoluto.
2. **iOS 16.4+:** Soporta Web Push *solamente* si la PWA se instaló en la "Pantalla de Inicio". Safari normal no recibirá notificaciones.
3. **Android:** Funciona tanto instalado como desde el navegador estándar Chrome.
4. **Sonidos:** Para modificar si quieres sonido, ve a **Configuración > Notificaciones** en la app. Esto setea el booleano `notificationSoundsEnabled` en tu `User`.

Cualquier falla en el registro del Service Worker en `/manifest.json` invalidará la funcionalidad Push. Si la PWA no instala, verifica que los certificados SSL (https) estén activos y válidos en el entorno de producción.
