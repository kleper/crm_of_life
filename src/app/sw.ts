import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { Serwist, StaleWhileRevalidate, NetworkOnly } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: any;

const customCache: RuntimeCaching[] = [
  {
    matcher: ({ request, url }) => {
      if (request.destination === "document") {
        return url.pathname.startsWith('/login') ||
               url.pathname.startsWith('/api/auth') ||
               url.pathname.startsWith('/select-tenant') ||
               url.pathname.startsWith('/kudos');
      }
      return false;
    },
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ url }) => url.pathname.startsWith('/api/offline/'),
    handler: new StaleWhileRevalidate({
      cacheName: 'offline-api-cache',
      plugins: [{
        cacheWillUpdate: async ({ response }) => response
      }]
    }),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: customCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          if (request.destination !== "document") return false;
          // Ignorar rutas de Auth y de selección de tenant
          const requestUrl = new URL(request.url);
          if (requestUrl.pathname.startsWith('/login') || 
              requestUrl.pathname.startsWith('/api/auth') || 
              requestUrl.pathname.startsWith('/select-tenant') ||
              requestUrl.pathname.startsWith('/kudos')) {
            return false;
          }
          return true;
        },
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener("push", (event: any) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || "Nueva Notificación";
      const options = {
        body: data.body,
        icon: "/icon-192x192.png",
        data: {
          url: data.url || data.link || "/",
          soundType: data.soundType || "default"
        },
      };

      event.waitUntil(
        (async () => {
          // Mostrar notificación nativa (si el OS lo permite)
          await self.registration.showNotification(title, options);

          // Avisar a los clientes (pestañas) activos para reproducir sonido in-app
          const clients = await self.clients.matchAll({ 
            type: "window", 
            includeUncontrolled: true 
          });
          
          clients.forEach((client: any) => {
            client.postMessage({ 
              type: "PLAY_NOTIFICATION_SOUND", 
              soundType: data.soundType || "default" 
            });
          });
        })()
      );
    } catch (e) {
      event.waitUntil(
        self.registration.showNotification("Notificación CRM", {
          body: event.data.text(),
          icon: "/icon-192x192.png",
        })
      );
    }
  }
});

self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList: any[]) => {
      const urlToOpen = event.notification.data?.url || "/";
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
