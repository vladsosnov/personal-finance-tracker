"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { AuthView } from "@/features/auth/components/auth-view";
import { LOGIN, REGISTER } from "@/features/dashboard/gql/dashboard";
import { APP_ROUTES } from "@/shared/constants/routes";
import { AUTH_TOKEN_KEY } from "@/shared/constants/storage";
import type { AuthMode } from "@/shared/types/shared";

type AuthPayload = {
  token: string;
  user: {
    id: string;
    email: string;
  };
};

export const AuthClient = () => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [register, { loading: isRegistering }] = useMutation<{ register: AuthPayload }>(REGISTER);
  const [login, { loading: isLoggingIn }] = useMutation<{ login: AuthPayload }>(LOGIN);

  useEffect(() => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      router.replace(APP_ROUTES.dashboard);
      return;
    }

    setIsHydrated(true);
  }, [router]);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }

    const payload =
      authMode === "register"
        ? (await register({ variables: { email: email.trim(), password: password.trim() } })).data?.register
        : (await login({ variables: { email: email.trim(), password: password.trim() } })).data?.login;

    if (!payload) {
      return;
    }

    window.localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
    router.replace(APP_ROUTES.dashboard);
    router.refresh();
  };

  if (!isHydrated) {
    return null;
  }

  return (
    <AuthView
      authMode={authMode}
      email={email}
      password={password}
      isLoading={isRegistering || isLoggingIn}
      setAuthMode={setAuthMode}
      setEmail={setEmail}
      setPassword={setPassword}
      onSubmit={handleAuth}
    />
  );
};
