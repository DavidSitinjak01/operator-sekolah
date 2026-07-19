"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { School, Loader2, Eye, EyeOff, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Underwater/Ocean Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-900" />

      {/* Animated light rays */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-96 h-[600px] bg-gradient-to-b from-emerald-400/20 to-transparent rotate-12 animate-pulse" />
        <div className="absolute top-[-10%] left-[40%] w-72 h-[500px] bg-gradient-to-b from-teal-300/15 to-transparent -rotate-6 animate-pulse [animation-delay:1s]" />
        <div className="absolute top-[-15%] right-[15%] w-80 h-[550px] bg-gradient-to-b from-emerald-300/10 to-transparent rotate-6 animate-pulse [animation-delay:2s]" />
      </div>

      {/* Floating bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-[-5%] left-[15%] w-4 h-4 rounded-full bg-white/10 animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] left-[35%] w-6 h-6 rounded-full bg-white/8 animate-[float_10s_ease-in-out_infinite_1s]" />
        <div className="absolute bottom-[-5%] left-[55%] w-3 h-3 rounded-full bg-white/12 animate-[float_7s_ease-in-out_infinite_2s]" />
        <div className="absolute bottom-[-8%] left-[75%] w-5 h-5 rounded-full bg-white/6 animate-[float_12s_ease-in-out_infinite_3s]" />
        <div className="absolute bottom-[-3%] left-[90%] w-4 h-4 rounded-full bg-white/10 animate-[float_9s_ease-in-out_infinite_0.5s]" />
        <div className="absolute bottom-[-12%] left-[25%] w-7 h-7 rounded-full bg-white/5 animate-[float_11s_ease-in-out_infinite_4s]" />
        <div className="absolute bottom-[-6%] left-[65%] w-3 h-3 rounded-full bg-white/15 animate-[float_6s_ease-in-out_infinite_1.5s]" />
      </div>

      {/* Wave shapes at bottom */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg
          viewBox="0 0 1440 320"
          className="w-full h-24 opacity-20"
          preserveAspectRatio="none"
        >
          <path
            fill="white"
            d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl shadow-emerald-950/30">
          <CardHeader className="text-center space-y-4 pb-2">
            {/* Logo */}
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 shadow-lg shadow-emerald-500/20">
              <School className="w-8 h-8 text-emerald-300" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white tracking-tight">
                Operator Sekolah
              </CardTitle>
              <CardDescription className="text-emerald-200/70 mt-1.5">
                Sistem Informasi Manajemen Sekolah
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/15 border border-red-400/30 rounded-lg px-4 py-3 text-red-200 text-sm text-center backdrop-blur-sm">
                  {error}
                </div>
              )}

              {/* Username Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-sm font-medium text-emerald-100/80"
                >
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  className="h-11 bg-white/10 border-white/20 text-white placeholder:text-emerald-200/40 focus:bg-white/15 focus:border-emerald-400/50 focus:ring-emerald-400/30 transition-all"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-emerald-100/80"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 bg-white/10 border-white/20 text-white placeholder:text-emerald-200/40 focus:bg-white/15 focus:border-emerald-400/50 focus:ring-emerald-400/30 pr-11 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-200/50 hover:text-emerald-200/80 transition-colors"
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
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Waves className="w-4 h-4 mr-2" />
                    Masuk
                  </>
                )}
              </Button>
            </form>

            {/* Footer hint */}
            <p className="text-center text-emerald-200/40 text-xs mt-6">
              Hubungi administrator jika Anda lupa akun
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}