// IndexedDB wrapper for offline data caching

const DB_NAME = 'speedwork-offline';
const DB_VERSION = 2;

const STORES = [
  'documents',
  'teams',
  'team_members',
  'work_tasks',
  'work_proofs',
  'missions',
  'mission_applications',
  'profiles',
  'notifications',
  'expenses',
  'products',
  'field_reports',
  'workers',
  'time_entries',
  'sales',
  'stock_movements',
  'sync_queue',
  'meta',
] as const;

export type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: store === 'sync_queue' ? 'queueId' : 'id' });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export async function putAll<T extends { id?: string }>(store: StoreName, items: T[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(store, 'readwrite');
  const os = tx.objectStore(store);
  for (const item of items) {
    os.put(item);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function putOne<T>(store: StoreName, item: T): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).put(item);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDB();
  const tx = db.transaction(store, 'readonly');
  const request = tx.objectStore(store).getAll();
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function getOne<T>(store: StoreName, id: string): Promise<T | undefined> {
  const db = await openDB();
  const tx = db.transaction(store, 'readonly');
  const request = tx.objectStore(store).get(id);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteOne(store: StoreName, id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearStore(store: StoreName): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Store last sync timestamp per table
export async function setLastSync(table: string): Promise<void> {
  await putOne('meta', { id: `sync_${table}`, timestamp: Date.now() });
}

export async function getLastSync(table: string): Promise<number | null> {
  const meta = await getOne<{ id: string; timestamp: number }>('meta', `sync_${table}`);
  return meta?.timestamp ?? null;
}
