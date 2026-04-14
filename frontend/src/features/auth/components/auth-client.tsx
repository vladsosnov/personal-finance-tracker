"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApolloClient } from "@apollo/client/react";
import { AuthView } from "@/features/auth/components/auth-view";
import { API_BASE_URL } from "@/shared/constants/auth";
import { APP_ROUTES } from "@/shared/constants/routes";
import { GET_ME } from "@/shared/gql/queries";
import type { AuthMode } from "@/shared/types/shared";
import { trackEvent } from "@/shared/lib/analytics";
import { isValidEmail } from "@/shared/lib/validation";
import { tokenStorage } from "@/shared/lib/token-storage";

export const AuthClient = () => {
  const apolloClient = useApolloClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "google_failed" ? "Google sign-in failed. Please try again." : null
  );
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const nextPath = searchParams.get("next");

  const handleAuth = async () => {
    setEmailError(null);
    setPasswordError(null);

    let valid = true;
    if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address");
      valid = false;
    }
    if (!password.trim()) {
      setPasswordError("Password is required");
      valid = false;
    } else if (authMode === "register" && password.trim().length < 8) {
      setPasswordError("Password must be at least 8 characters");
      valid = false;
    }
    if (!valid) return;

    trackEvent(authMode === "register" ? "register_click" : "login_click");

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/${authMode === "register" ? "register" : "login"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; accessToken?: string; refreshToken?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Authentication failed");
      }

      if (payload?.accessToken && payload?.refreshToken) {
        tokenStorage.set(payload.accessToken, payload.refreshToken);
      }

      await apolloClient.refetchQueries({ include: [GET_ME] });
      router.replace(nextPath || APP_ROUTES.dashboard);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const googleAuthUrl = nextPath
    ? `${API_BASE_URL}/auth/google?next=${encodeURIComponent(nextPath)}`
    : `${API_BASE_URL}/auth/google`;

  return (
    <AuthView
      authMode={authMode}
      email={email}
      password={password}
      isLoading={isLoading}
      error={error}
      emailError={emailError}
      passwordError={passwordError}
      googleAuthUrl={googleAuthUrl}
      setAuthMode={(mode) => { setAuthMode(mode); setEmailError(null); setPasswordError(null); setError(null); }}
      setEmail={(v) => { setEmail(v); setEmailError(null); }}
      setPassword={(v) => { setPassword(v); setPasswordError(null); }}
      onSubmit={handleAuth}
    />
  );
};
