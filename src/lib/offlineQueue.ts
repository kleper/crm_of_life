import { get, set } from 'idb-keyval';

const QUEUE_KEY = 'offline-action-queue';

export type OfflineAction = {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
};

export async function getQueue(): Promise<OfflineAction[]> {
  const queue = await get(QUEUE_KEY);
  return queue || [];
}

export async function saveQueue(queue: OfflineAction[]): Promise<void> {
  await set(QUEUE_KEY, queue);
}

export async function enqueueAction(type: string, payload: any): Promise<void> {
  const queue = await getQueue();
  queue.push({
    id: crypto.randomUUID(),
    type,
    payload,
    timestamp: Date.now(),
  });
  await saveQueue(queue);
}

export async function clearQueue(): Promise<void> {
  await set(QUEUE_KEY, []);
}
