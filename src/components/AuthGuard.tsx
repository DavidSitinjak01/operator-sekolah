"use client";

import { useSession, SessionProvider } from "next-auth/react";
import LoginPage from "./LoginPage";

function AuthGuardInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // Show login page immediately — no "Memuat..." spinner
  // NextAuth session check happens silently in background
  if (!session) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthGuardInner>{children}</AuthGuardInner>
    </SessionProvider>
  );
}
