"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthView } from "@/features/auth/components/auth-view";
import { API_BASE_URL } from "@/shared/constants/auth";
import { APP_ROUTES } from "@/shared/constants/routes";
import type { AuthMode } from "@/shared/types/shared";
import { trackEvent } from "@/shared/lib/analytics";

export const AuthClient = () => {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }

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

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Authentication failed");
      }

      router.replace(APP_ROUTES.dashboard);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthView
      authMode={authMode}
      email={email}
      password={password}
      isLoading={isLoading}
      error={error}
      setAuthMode={setAuthMode}
      setEmail={setEmail}
      setPassword={setPassword}
      onSubmit={handleAuth}
    />
  );
};
