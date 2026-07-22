"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { School, Loader2, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import LogoReveal from "@/components/LogoReveal";

interface SchoolInfo {
  namaSekolah: string;
  npsn: string;
  logoSekolah: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [loadingSchool, setLoadingSchool] = useState(true);

  useEffect(() => {
    fetch("/api/pengaturan")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSchoolInfo({
            namaSekolah: data.namaSekolah || "Operator Sekolah",
            npsn: data.npsn || "",
            logoSekolah: data.logoSekolah || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSchool(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Username atau password salah");
      } else {
        router.refresh();
        window.location.reload();
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Resolve logo src: data URI → direct, file path → /icon route
  const getLogoSrc = () => {
    if (!schoolInfo?.logoSekolah) return null;
    if (schoolInfo.logoSekolah.startsWith("data:")) return schoolInfo.logoSekolah;
    return "/icon";
  };

  const hasLogo = !!getLogoSrc();
  const schoolName = schoolInfo?.namaSekolah || "Operator Sekolah";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50">

      {/* ─── Decorative blurred blobs ─── */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-emerald-100/50 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* ═══════════════════════════════════════════════════════════════════
          LEFT SIDE — Robot → Logo Animation (hidden on mobile, visible lg+)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col items-center justify-center p-8 xl:p-12">
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url('/images/pattern-edu.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="relative z-10 flex flex-col items-center w-full max-w-lg">
          {!loadingSchool && (
            <LogoReveal
              logoSrc={getLogoSrc()}
              schoolName={schoolName}
              hasLogo={hasLogo}
            />
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          RIGHT SIDE — Login Form
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12 relative z-10">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-emerald-900/5 rounded-2xl">
          <CardHeader className="text-center space-y-4 pb-2 pt-8 px-8">
            {/* Mobile: Logo circle — only visible on small screens */}
            <div className="lg:hidden mx-auto w-32 h-32 relative">
              {hasLogo ? (
                <>
                  <div className="absolute -inset-2 bg-gradient-to-br from-emerald-200/40 to-teal-200/30 rounded-full blur-xl" />
                  <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white shadow-lg flex items-center justify-center bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getLogoSrc()!}
                      alt={`Logo ${schoolName}`}
                      width={128}
                      height={128}
                      className="w-full h-full object-contain p-2"
                      priority
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute -inset-2 bg-gradient-to-br from-emerald-200/40 to-teal-200/30 rounded-full blur-xl" />
                  <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <School className="w-12 h-12 text-white" />
                  </div>
                </>
              )}
            </div>

            {/* Desktop: School logo or default icon */}
            {loadingSchool ? (
              <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100">
                <Skeleton className="w-7 h-7 rounded-md" />
              </div>
            ) : hasLogo ? (
              <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-emerald-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getLogoSrc()!}
                  alt={`Logo ${schoolName}`}
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                <School className="w-7 h-7 text-white" />
              </div>
            )}

            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">
                {loadingSchool ? (
                  <Skeleton className="h-7 w-48 mx-auto" />
                ) : (
                  schoolName
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1.5">
                Masuk ke Sistem Informasi Sekolah
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200/80 rounded-xl px-4 py-3 text-red-600 text-sm text-center animate-in fade-in slide-in-from-top-2 duration-300">
                  {error}
                </div>
              )}

              {/* Username Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700"
                >
                  Username
                </Label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                  </div>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                    className="h-12 pl-11 bg-gray-50/80 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-emerald-400 focus:ring-emerald-400/20 transition-all rounded-xl"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pl-11 pr-11 bg-gray-50/80 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-emerald-400 focus:ring-emerald-400/20 transition-all rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl mt-2 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Masuk ke Sistem
                  </>
                )}
              </Button>
            </form>

            {/* Footer hint */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-center text-muted-foreground text-xs">
                Hubungi administrator jika Anda lupa akun
              </p>
              <p className="text-center text-muted-foreground/50 text-[10px] mt-1.5">
                &copy; {new Date().getFullYear()} {schoolName} &mdash; Sistem Informasi Manajemen Sekolah
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
