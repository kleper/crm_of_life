import { toast } from "@/lib/toast";

/**
 * Subscribes the current browser to push notifications.
 * Handles: permission request, service worker readiness, push subscription, and server registration.
 * Returns true on success, false on failure.
 */
export async function subscribeToPushNotifications(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) {
    console.warn("[PushClient] Service workers not supported");
    return false;
  }
  if (!("PushManager" in window)) {
    console.warn("[PushClient] Push API not supported");
    return false;
  }

  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  if (!publicVapidKey) {
    console.warn("[PushClient] No public VAPID key found");
    return false;
  }

  try {
    // Step 1: Request notification permission if not already granted
    if (Notification.permission === "denied") {
      console.warn("[PushClient] Notification permission denied by user");
      toast.error("Notificaciones bloqueadas. Habilítalas en la configuración de tu navegador.");
      return false;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("[PushClient] User declined notification permission");
        return false;
      }
    }

    // Step 2: Wait for the service worker to be ready
    const registration = await navigator.serviceWorker.ready;

    // Step 3: Get or create push subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey).buffer as ArrayBuffer,
      });
    }

    // Step 4: Save subscription to server
    const res = await fetch("/api/web-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("[PushClient] Server rejected subscription:", errorText);
      return false;
    }

    console.log("[PushClient] ✓ Push subscription registered successfully");
    return true;
  } catch (error) {
    console.error("[PushClient] Error subscribing to push:", error);
    return false;
  }
}

/**
 * Converts a URL-safe base64 string to a Uint8Array (for VAPID applicationServerKey).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
