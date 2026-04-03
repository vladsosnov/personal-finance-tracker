"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE } from "@/shared/constants/auth";

const PROTECTED_PATHS = ["/dashboard", "/profile", "/admin"];
const AUTH_ONLY_PATHS = ["/auth"];
const AUTH_BYPASS_PATHS = ["/auth/verify-email", "/auth/forgot-password", "/auth/reset-password"];

const getCookie = (name: string) =>
  document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];

const hasSession = () =>
  Boolean(getCookie(AUTH_ACCESS_COOKIE) || getCookie(AUTH_REFRESH_COOKIE));

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isProtected = PROTECTED_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
    const isBypass = AUTH_BYPASS_PATHS.some((p) => pathname === p);
    const isAuthOnly =
      !isBypass && AUTH_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    const session = hasSession();

    if (isProtected && !session) {
      router.replace("/auth");
    } else if (isAuthOnly && session) {
      router.replace("/dashboard");
    }
  }, [pathname, router]);

  return <>{children}</>;
};
