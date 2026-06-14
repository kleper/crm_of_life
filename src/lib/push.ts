import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || '';

webpush.setVapidDetails(
  'mailto:admin@crm.com', // Replace with your contact email
  publicVapidKey,
  privateVapidKey
);

export async function sendPushNotification(subscription: any, payload: any) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

export async function sendPushToUser(userId: string, payload: any) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId }
  });

  if (subscriptions.length === 0) return;

  const pushPromises = subscriptions.map(async (sub) => {
    const subscriptionConfig = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      }
    };

    try {
      await webpush.sendNotification(subscriptionConfig, JSON.stringify(payload));
    } catch (error: any) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        console.log(`Eliminando PushSubscription muerta para el usuario ${userId} (endpoint: ${sub.endpoint})`);
        await prisma.pushSubscription.delete({
          where: { endpoint: sub.endpoint }
        }).catch((e) => console.error("Failed to delete subscription", e));
      } else {
        console.error('Error sending push notification to user:', error);
      }
    }
  });

  await Promise.allSettled(pushPromises);
}
