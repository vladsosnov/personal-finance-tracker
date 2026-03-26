import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

type JwtPayload = {
  sub: string;
  exp: number;
  type: "access" | "refresh";
  tv?: number;
};

const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret) throw new Error("JWT_SECRET is required in production");
    if (secret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
  return secret ?? "local-dev-jwt-secret";
})();
const PASSWORD_ITERATIONS = 100_000;
const ACCESS_TOKEN_TTL_SEC = 60 * 15;
const REFRESH_TOKEN_TTL_SEC = 60 * 60 * 24 * 30;

export const AUTH_ACCESS_COOKIE = "fgt_access";
export const AUTH_REFRESH_COOKIE = "fgt_refresh";

const toBase64Url = (input: Buffer | string): string => {
  const source = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return source
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const fromBase64Url = (input: string): Buffer => {
  const padded = input.padEnd(input.length + ((4 - (input.length % 4)) % 4), "=").replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
};

export const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 64, "sha512").toString("hex");
  return { hash, salt };
};

export const verifyPassword = (password: string, hash: string, salt: string): boolean => {
  const computed = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 64, "sha512").toString("hex");
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computed, "hex"));
};

const signToken = (userId: string, type: JwtPayload["type"], ttlSec: number, tokenVersion = 0): string => {
  const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + ttlSec,
      type,
      tv: tokenVersion,
    } satisfies JwtPayload)
  );
  const content = `${header}.${payload}`;
  const signature = toBase64Url(createHmac("sha256", JWT_SECRET).update(content).digest());
  return `${content}.${signature}`;
};

export const signJwt = (userId: string, tokenVersion = 0): string => signToken(userId, "access", ACCESS_TOKEN_TTL_SEC, tokenVersion);

export const signRefreshJwt = (userId: string, tokenVersion = 0): string => signToken(userId, "refresh", REFRESH_TOKEN_TTL_SEC, tokenVersion);

type TokenResult = { userId: string; tokenVersion: number } | null;

const verifyToken = (token: string | undefined, expectedType: JwtPayload["type"]): TokenResult => {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, payload, signature] = parts;
  const content = `${header}.${payload}`;
  const expected = toBase64Url(createHmac("sha256", JWT_SECRET).update(content).digest());

  if (expected.length !== signature.length) {
    return null;
  }

  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return null;
  }

  const decoded = JSON.parse(fromBase64Url(payload).toString("utf8")) as JwtPayload;
  if (!decoded.sub || decoded.type !== expectedType || decoded.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return { userId: decoded.sub, tokenVersion: decoded.tv ?? 0 };
};

export const verifyJwt = (token?: string): TokenResult => verifyToken(token, "access");

export const verifyRefreshJwt = (token?: string): TokenResult => verifyToken(token, "refresh");

export const buildCookie = (name: string, value: string, maxAgeSec: number): string => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
};

export const buildExpiredCookie = (name: string): string => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
};

export const authCookieHeaders = (userId: string, tokenVersion = 0): string[] => [
  buildCookie(AUTH_ACCESS_COOKIE, signJwt(userId, tokenVersion), ACCESS_TOKEN_TTL_SEC),
  buildCookie(AUTH_REFRESH_COOKIE, signRefreshJwt(userId, tokenVersion), REFRESH_TOKEN_TTL_SEC),
];

export const generateSecureToken = (): string => randomBytes(32).toString("hex");
