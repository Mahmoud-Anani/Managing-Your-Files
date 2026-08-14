"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "myf.sidebar-collapsed";

const listeners = new Set<() => void>();
let cachedValue: boolean | null = null;

function readStored(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getSnapshot(): boolean {
  if (cachedValue === null) {
    cachedValue = readStored();
  }
  return cachedValue;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  cachedValue = readStored();
  for (const listener of listeners) {
    listener();
  }
}

export function useSidebarCollapsed(): {
  collapsed: boolean;
  toggle: () => void;
} {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const toggle = useCallback(() => {
    const next = !getSnapshot();
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // ignore storage failures
    }
    cachedValue = next;
    emit();
  }, []);

  return { collapsed, toggle };
}
