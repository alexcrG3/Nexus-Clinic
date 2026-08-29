// IndexedDB storage for local video and media files
const DB_NAME = "ClinicMediaDB";
const STORE_NAME = "media_files";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalVideo(file: File | Blob, key = "custom_commercial_video"): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(file, key);
    request.onsuccess = () => {
      resolve(`indexeddb://${key}`);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getLocalVideoBlob(key = "custom_commercial_video"): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
