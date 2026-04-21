"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { GET_ME, type MeQueryData } from "@/shared/gql/queries";

const PROTECTED_PATHS = ["/goals", "/profile", "/expenses", "/admin"];
const AUTH_ONLY_PATHS = ["/auth"];
const AUTH_BYPASS_PATHS = ["/auth/verify-email", "/auth/forgot-password", "/auth/reset-password"];

const isSafeRedirect = (target: string | null): target is string =>
  typeof target === "string" && target.startsWith("/") && !target.startsWith("//");

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data, loading } = useQuery<MeQueryData>(GET_ME, {
    fetchPolicy: "cache-and-network",
  });

  const isAuthed = Boolean(data?.me);
  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  useEffect(() => {
    if (loading) return;

    const isBypass = AUTH_BYPASS_PATHS.some((p) => pathname === p);
    const isAuthOnly =
      !isBypass && AUTH_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    const rawSearch = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(rawSearch);
    const currentUrl = `${pathname}${rawSearch}`;
    const nextTarget = params.get("next");

    if (isProtected && !isAuthed) {
      router.replace(`/auth?next=${encodeURIComponent(currentUrl)}`);
    } else if (isAuthOnly && isAuthed) {
      router.replace(isSafeRedirect(nextTarget) ? nextTarget : "/goals");
    }
  }, [pathname, router, data, loading, isAuthed, isProtected]);

  // Don't flash protected content while auth state is loading
  if (isProtected && loading && !data) {
    return null;
  }

  return <>{children}</>;
};
