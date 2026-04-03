import { Suspense } from "react";
import { AuthClient } from "@/features/auth/components/auth-client";

const AuthPage = () => {
  return (
    <Suspense>
      <AuthClient />
    </Suspense>
  );
};

export default AuthPage;
