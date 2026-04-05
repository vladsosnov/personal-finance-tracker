const ACCESS_KEY = "fgt_access";
const REFRESH_KEY = "fgt_refresh";

const storage = typeof window !== "undefined" ? window.localStorage : null;

export const tokenStorage = {
  getAccess: () => storage?.getItem(ACCESS_KEY) ?? null,
  getRefresh: () => storage?.getItem(REFRESH_KEY) ?? null,
  set: (accessToken: string, refreshToken: string) => {
    storage?.setItem(ACCESS_KEY, accessToken);
    storage?.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    storage?.removeItem(ACCESS_KEY);
    storage?.removeItem(REFRESH_KEY);
  },
};
