const ACCESS_KEY = "fgt_access";

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
  set: (accessToken: string, _refreshToken?: string) => {
    safeSet(ACCESS_KEY, accessToken);
  },
  clear: () => {
    safeRemove(ACCESS_KEY);
    // Clean up legacy refresh token if present from older versions
    safeRemove("fgt_refresh");
  },
};
