"use client";

import { useSession, SessionProvider } from "next-auth/react";
import LoginPage from "./LoginPage";
import { Loader2, School } from "lucide-react";

function AuthGuardInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 animate-pulse">
            <School className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
            <p className="text-emerald-700 font-medium text-sm">Memuat...</p>
          </div>
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