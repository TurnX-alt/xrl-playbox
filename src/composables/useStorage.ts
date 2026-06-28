import { load, type Store } from "@tauri-apps/plugin-store";

const STORE_NAME = "game-data.json";

let tauriStore: Store | null = null;
let tauriStoreInitPromise: Promise<Store> | null = null;

function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as Record<string, unknown>).__TAURI__;
}

async function getTauriStore(): Promise<Store | null> {
  if (!isTauri()) return null;
  if (tauriStore) return tauriStore;
  if (tauriStoreInitPromise) return tauriStoreInitPromise;
  tauriStoreInitPromise = load(STORE_NAME, { autoSave: true, defaults: {} }).catch((err) => {
    console.error("Failed to load Tauri store:", err);
    return null as unknown as Store;
  });
  const store = await tauriStoreInitPromise;
  tauriStore = store;
  return store;
}

export async function storageGet<T>(key: string): Promise<T | null> {
  try {
    const store = await getTauriStore();
    if (store) {
      const value = await store.get<T>(key);
      return value ?? null;
    }
  } catch {
    // fall through to localStorage
  }
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  try {
    const store = await getTauriStore();
    if (store) {
      await store.set(key, value);
      return;
    }
  } catch {
    // fall through to localStorage
  }
  localStorage.setItem(key, JSON.stringify(value));
}

export async function storageRemove(key: string): Promise<void> {
  try {
    const store = await getTauriStore();
    if (store) {
      await store.delete(key);
      return;
    }
  } catch {
    // fall through
  }
  localStorage.removeItem(key);
}

export async function storageClear(): Promise<void> {
  try {
    const store = await getTauriStore();
    if (store) {
      await store.clear();
      return;
    }
  } catch {
    // fall through
  }
  localStorage.clear();
}
