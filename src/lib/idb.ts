import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface CRMDBSchema extends DBSchema {
  'pending-mutations': {
    key: number;
    value: {
      id?: number;
      type: 'CREATE_TASK' | 'LOG_INTERACTION';
      payload: any;
      organizationId: string;
      createdAt: number;
      status: 'pending' | 'syncing' | 'failed';
      retryCount: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<CRMDBSchema>> | null = null;

export function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB<CRMDBSchema>('crm-vida-offline', 1, {
      upgrade(db) {
        db.createObjectStore('pending-mutations', {
          keyPath: 'id',
          autoIncrement: true,
        });
      },
    });
  }
  return dbPromise;
}

export async function addPendingMutation(type: 'CREATE_TASK' | 'LOG_INTERACTION', payload: any, organizationId: string) {
  const db = await getDB();
  if (!db) return;
  return db.add('pending-mutations', {
    type,
    payload,
    organizationId,
    createdAt: Date.now(),
    status: 'pending',
    retryCount: 0,
  });
}

export async function getPendingMutations() {
  const db = await getDB();
  if (!db) return [];
  return db.getAll('pending-mutations');
}

export async function updateMutationStatus(id: number, status: 'pending' | 'syncing' | 'failed', retryCount?: number) {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction('pending-mutations', 'readwrite');
  const store = tx.objectStore('pending-mutations');
  const item = await store.get(id);
  if (item) {
    item.status = status;
    if (retryCount !== undefined) {
      item.retryCount = retryCount;
    }
    await store.put(item);
  }
}

export async function deleteMutation(id: number) {
  const db = await getDB();
  if (!db) return;
  return db.delete('pending-mutations', id);
}
