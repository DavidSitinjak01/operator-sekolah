"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, admin is changing another user's password */
  targetUserId?: string | null;
  /** Callback after successful password change (to invalidate queries) */
  onSuccess?: () => void;
}

export default function ChangePasswordDialog({
  open,
  onOpenChange,
  targetUserId,
  onSuccess,
}: ChangePasswordDialogProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const isAdmin = ((session?.user as Record<string, unknown>)?.role as string) === "admin";

  // Self-change mode
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Admin: select target user
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: users = [] } = useQuery<
    Array<{ id: string; username: string; name: string }>
  >({
    queryKey: ["users-list"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAdmin && !!targetUserId && open,
  });

  const isTargetMode = isAdmin && !!targetUserId;

  // Reset form on open
  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSelectedUserId("");
      setShowOld(false);
      setShowNew(false);
      setShowConfirm(false);
    }
    onOpenChange(val);
  };

  const handleSubmit = async () => {
    if (!isTargetMode && !targetUserId) {
      // Self change
      if (!oldPassword) {
        toast({ title: "Peringatan", description: "Password lama wajib diisi", variant: "destructive" });
        return;
      }
    }

    if (newPassword.length < 6) {
      toast({ title: "Peringatan", description: "Password baru minimal 6 karakter", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Peringatan", description: "Konfirmasi password tidak cocok", variant: "destructive" });
      return;
    }

    const finalUserId = isTargetMode ? selectedUserId : targetUserId;

    if (isTargetMode && !finalUserId) {
      toast({ title: "Peringatan", description: "Pilih user terlebih dahulu", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = {
        newPassword,
      };

      if (!isTargetMode || !finalUserId) {
        body.oldPassword = oldPassword;
      } else {
        body.userId = finalUserId;
      }

      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Gagal", description: data.error || "Gagal mengubah password", variant: "destructive" });
        return;
      }

      toast({ title: "Berhasil", description: "Password berhasil diubah" });
      handleOpenChange(false);
      onSuccess?.();
    } catch {
      toast({ title: "Gagal", description: "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary rounded-lg p-2">
              <KeyRound className="w-5 h-5" />
            </div>
            <DialogTitle>
              {isTargetMode ? "Ganti Password User Lain" : "Ganti Password"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isTargetMode
              ? "Pilih user dan masukkan password baru."
              : "Masukkan password lama dan password baru Anda."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Admin: select target user */}
          {isTargetMode && (
            <div className="space-y-2">
              <Label>Pilih User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Self: old password */}
          {!isTargetMode && (
            <div className="space-y-2.5">
              <Label htmlFor="old-pw" className="text-sm font-medium">Password Lama</Label>
              <div className="relative">
                <Input
                  id="old-pw"
                  type={showOld ? "text" : "password"}
                  placeholder="Masukkan password lama"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  className="pr-10 h-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* New password */}
          <div className="space-y-2.5">
            <Label htmlFor="new-pw" className="text-sm font-medium">Password Baru</Label>
            <div className="relative">
              <Input
                id="new-pw"
                type={showNew ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className="pr-10 h-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-2.5">
            <Label htmlFor="confirm-pw" className="text-sm font-medium">Konfirmasi Password Baru</Label>
            <div className="relative">
              <Input
                id="confirm-pw"
                type={showConfirm ? "text" : "password"}
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className="pr-10 h-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">Password tidak cocok</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}