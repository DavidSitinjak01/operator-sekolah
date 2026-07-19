"use client";

import { useSession, SessionProvider } from "next-auth/react";
import LoginPage from "./LoginPage";

function AuthGuardInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-900">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto" />
          <p className="text-emerald-200/60 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

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