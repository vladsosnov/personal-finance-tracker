import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "custom-goal-colors";
const MAX_CUSTOM_COLORS = 20;

type CustomColor = {
  value: string;
  label: string;
};

const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

const getSnapshot = (): CustomColor[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

const EMPTY: CustomColor[] = [];
let cachedColors: CustomColor[] = EMPTY;
let cachedRaw: string | undefined;

const getSnapshotStable = (): CustomColor[] => {
  if (typeof window === "undefined") return EMPTY;
  const raw = localStorage.getItem(STORAGE_KEY) ?? "";
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedColors = raw ? getSnapshot() : EMPTY;
  }
  return cachedColors;
};

export const useCustomColors = () => {
  const colors = useSyncExternalStore(subscribe, getSnapshotStable, () => EMPTY);

  const addColor = useCallback((hex: string, label: string) => {
    const current = getSnapshot();
    const normalized = hex.toUpperCase();

    if (current.some((c) => c.value.toUpperCase() === normalized)) {
      return false;
    }
    if (current.length >= MAX_CUSTOM_COLORS) {
      return false;
    }

    const next = [...current, { value: hex, label: label.trim() || hex }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    cachedRaw = undefined;
    notifyListeners();
    return true;
  }, []);

  const removeColor = useCallback((hex: string) => {
    const current = getSnapshot();
    const next = current.filter((c) => c.value !== hex);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    cachedRaw = undefined;
    notifyListeners();
  }, []);

  return { colors, addColor, removeColor, maxColors: MAX_CUSTOM_COLORS };
};
