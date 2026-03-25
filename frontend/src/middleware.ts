import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE } from "@/shared/constants/auth";

const PROTECTED_PATHS = ["/dashboard", "/profile"];
const AUTH_ONLY_PATHS = ["/auth"];
const AUTH_BYPASS_PATHS = ["/auth/verify-email", "/auth/forgot-password", "/auth/reset-password"];

const hasSessionCookie = (request: NextRequest) =>
  Boolean(request.cookies.get(AUTH_ACCESS_COOKIE)?.value || request.cookies.get(AUTH_REFRESH_COOKIE)?.value);

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isBypass = AUTH_BYPASS_PATHS.some((path) => pathname === path);
  const isAuthOnly = !isBypass && AUTH_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const hasSession = hasSessionCookie(request);

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (isAuthOnly && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/auth/:path*"],
};
