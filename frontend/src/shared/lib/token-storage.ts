const ACCESS_KEY = "fgt_access";
const REFRESH_KEY = "fgt_refresh";

const getStorage = () => (typeof window !== "undefined" ? window.localStorage : null);

const safeGet = (key: string) => {
  try {
    return getStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string) => {
  try {
    getStorage()?.setItem(key, value);
  } catch {
    // Ignore storage failures. Cookies remain the primary session transport.
  }
};

const safeRemove = (key: string) => {
  try {
    getStorage()?.removeItem(key);
  } catch {
    // Ignore storage failures. Cookies remain the primary session transport.
  }
};

export const tokenStorage = {
  getAccess: () => safeGet(ACCESS_KEY),
  getRefresh: () => safeGet(REFRESH_KEY),
  set: (accessToken: string, refreshToken: string) => {
    safeSet(ACCESS_KEY, accessToken);
    safeSet(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    safeRemove(ACCESS_KEY);
    safeRemove(REFRESH_KEY);
  },
};
