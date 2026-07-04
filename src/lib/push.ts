import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';

if (!publicVapidKey || !privateVapidKey) {
  console.warn('[Push] ⚠️ VAPID keys not configured — push notifications will not work');
} else {
  webpush.setVapidDetails(
    'mailto:admin@crm.com',
    publicVapidKey,
    privateVapidKey
  );
}

export async function sendPushToUser(userId: string, payload: any) {
  if (!publicVapidKey || !privateVapidKey) {
    console.warn('[Push] Skipping — VAPID keys not configured');
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId }
  });

  if (subscriptions.length === 0) {
    console.log(`[Push] No subscriptions found for user ${userId}`);
    return;
  }

  console.log(`[Push] Sending to ${subscriptions.length} subscription(s) for user ${userId}`);

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const subscriptionConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        }
      };

      try {
        await webpush.sendNotification(subscriptionConfig, JSON.stringify(payload));
        console.log(`[Push] ✓ Sent to endpoint: ${sub.endpoint.slice(0, 60)}...`);
      } catch (error: any) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          // Subscription expired or unsubscribed — clean it up
          console.log(`[Push] ✗ Subscription expired (${error.statusCode}), removing: ${sub.endpoint.slice(0, 60)}...`);
          await prisma.pushSubscription.delete({
            where: { endpoint: sub.endpoint }
          }).catch((e) => console.error("[Push] Failed to delete expired subscription", e));
        } else if (error.statusCode === 403) {
          // VAPID key mismatch — subscription was created with different keys
          console.error(`[Push] ✗ VAPID key mismatch (403) for endpoint: ${sub.endpoint.slice(0, 60)}... — deleting stale subscription`);
          await prisma.pushSubscription.delete({
            where: { endpoint: sub.endpoint }
          }).catch((e) => console.error("[Push] Failed to delete mismatched subscription", e));
        } else {
          console.error(`[Push] ✗ Error sending to ${sub.endpoint.slice(0, 60)}...:`, error.statusCode || error.message);
        }
      }
    })
  );

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  console.log(`[Push] Results: ${succeeded} sent, ${failed} failed`);
}
