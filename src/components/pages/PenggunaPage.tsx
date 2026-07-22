"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Loader2,
  KeyRound,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { cn } from "@/lib/utils";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";

// ── Constants ─────────────────────────────────────────────────────────────────

const PREDEFINED_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "Kesiswaan", label: "Kesiswaan" },
  { value: "Kurikulum", label: "Kurikulum" },
  { value: "Sarpras", label: "Sarpras" },
  { value: "Keuangan", label: "Keuangan" },
  { value: "Hubin", label: "Hubin (Humas & Kemitraan)" },
  { value: "Perpustakaan", label: "Perpustakaan" },
  { value: "user", label: "User" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface RoleSelectProps {
  value: string;
  onValueChange: (v: string) => void;
  customValue: string;
  onCustomValueChange: (v: string) => void;
  id?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case "admin":
      return "bg-primary/10 text-primary";
    case "Kesiswaan":
      return "bg-sky-100 text-sky-700";
    case "Kurikulum":
      return "bg-violet-100 text-violet-700";
    case "Sarpras":
      return "bg-amber-100 text-amber-700";
    case "Keuangan":
      return "bg-rose-100 text-rose-700";
    case "Hubin":
      return "bg-orange-100 text-orange-700";
    case "Perpustakaan":
      return "bg-teal-100 text-teal-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getRoleDisplay(role: string): string {
  if (role === "admin") return "Admin";
  if (role === "user") return "User";
  return role;
}

function getEffectiveRole(selected: string, custom: string) {
  if (selected === "__custom__") return custom.trim();
  return selected;
}

// ── Role Select Component (declared outside render) ──────────────────────────

function RoleSelect({
  value,
  onValueChange,
  customValue,
  onCustomValueChange,
  id,
}: RoleSelectProps) {
  return (
    <div className="space-y-2">
      <Label>Role / Jabatan</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Pilih role..." />
        </SelectTrigger>
        <SelectContent>
          {PREDEFINED_ROLES.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
          <SelectItem value="__custom__" className="text-muted-foreground">
            ✏️ Lainnya (custom)...
          </SelectItem>
        </SelectContent>
      </Select>
      {value === "__custom__" && (
        <Input
          id={id}
          placeholder="Ketik nama role, contoh: Kesiswaan"
          value={customValue}
          onChange={(e) => onCustomValueChange(e.target.value)}
          autoComplete="off"
        />
      )}
    </div>
  );
}

// ── Page Guard ────────────────────────────────────────────────────────────────

export default function PenggunaPage() {
  const { data: session } = useSession();
  const role = ((session?.user as Record<string, unknown>)?.role as string) || "user";

  if (role !== "admin") {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Halaman ini hanya untuk admin.</p>
      </div>
    );
  }

  return <PenggunaContent />;
}

// ── Main Content ──────────────────────────────────────────────────────────────

function PenggunaContent() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const { toast } = useToast();
  const qc = useQueryClient();

  // Dialog states
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const deleteIdRef = useRef<string | null>(null);
  const [changePwForUser, setChangePwForUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Add form state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newRoleCustom, setNewRoleCustom] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);

  // Edit form state
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editRoleCustom, setEditRoleCustom] = useState("");

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users-list"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Gagal memuat");
      return res.json();
    },
  });

  // ── Add Mutation ──
  const addMutation = useMutation({
    mutationFn: async (data: {
      username: string;
      password: string;
      name: string;
      userRole: string;
    }) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menambah user");
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users-list"] });
      toast({ title: "Berhasil", description: "User berhasil ditambahkan" });
      resetAddForm();
      setAddOpen(false);
    },
    onError: (err) =>
      toast({ title: "Gagal", description: err.message, variant: "destructive" }),
  });

  // ── Edit Mutation ──
  const editMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      name: string;
      editRole: string;
    }) => {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit", ...data }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mengubah user");
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users-list"] });
      toast({ title: "Berhasil", description: "Data user berhasil diperbarui" });
      setEditOpen(false);
    },
    onError: (err) =>
      toast({ title: "Gagal", description: err.message, variant: "destructive" }),
  });

  // ── Toggle Mutation ──
  const toggleMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mengubah status");
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users-list"] });
    },
    onError: (err) =>
      toast({ title: "Gagal", description: err.message, variant: "destructive" }),
  });

  // ── Delete Mutation ──
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus user");
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users-list"] });
      toast({ title: "Berhasil", description: "User berhasil dihapus" });
      setDeleteTarget(null);
    },
    onError: (err) =>
      toast({ title: "Gagal", description: err.message, variant: "destructive" }),
  });

  // ── Form Helpers ──
  const resetAddForm = () => {
    setNewUsername("");
    setNewPassword("");
    setNewName("");
    setNewRole("user");
    setNewRoleCustom("");
    setShowNewPw(false);
  };

  const openEditDialog = (user: User) => {
    setEditId(user.id);
    setEditName(user.name);
    const isPreset = PREDEFINED_ROLES.some((r) => r.value === user.role);
    setEditRole(isPreset ? user.role : "__custom__");
    setEditRoleCustom(isPreset ? "" : user.role);
    setEditOpen(true);
  };

  const handleAdd = () => {
    if (!newUsername.trim() || !newPassword || !newName.trim()) {
      toast({
        title: "Peringatan",
        description: "Username, password, dan nama wajib diisi",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Peringatan",
        description: "Password minimal 6 karakter",
        variant: "destructive",
      });
      return;
    }
    const effectiveRole = getEffectiveRole(newRole, newRoleCustom);
    if (!effectiveRole) {
      toast({
        title: "Peringatan",
        description: "Role wajib diisi",
        variant: "destructive",
      });
      return;
    }
    addMutation.mutate({
      username: newUsername.trim(),
      password: newPassword,
      name: newName.trim(),
      userRole: effectiveRole,
    });
  };

  const handleEdit = () => {
    if (!editName.trim()) {
      toast({
        title: "Peringatan",
        description: "Nama wajib diisi",
        variant: "destructive",
      });
      return;
    }
    const effectiveRole = getEffectiveRole(editRole, editRoleCustom);
    if (!effectiveRole) {
      toast({
        title: "Peringatan",
        description: "Role wajib diisi",
        variant: "destructive",
      });
      return;
    }
    editMutation.mutate({
      userId: editId,
      name: editName.trim(),
      editRole: effectiveRole,
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
            <UserCog className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Kelola Pengguna</h1>
            <p className="text-sm text-muted-foreground">Kelola akun pengguna dan hak akses aplikasi</p>
          </div>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah User
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card shadow-md rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="w-32">Role</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-32">Dibuat</TableHead>
                <TableHead className="w-40 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="h-48">
                    <div className="space-y-3 px-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <div className="h-4 w-6 bg-muted rounded animate-pulse" />
                          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                          <div className="h-5 w-20 bg-muted rounded-full animate-pulse" />
                          <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                          <div className="flex gap-1 ml-auto">
                            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                            <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-48"
                  >
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Belum ada data pengguna</p>
                        <p className="text-sm">Klik tombol "Tambah User" untuk menambahkan pengguna baru</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {users.map((u, idx) => (
                <TableRow key={u.id} className={cn(!u.active ? "opacity-60" : "")}>
                  <TableCell className="text-center text-sm">{idx + 1}</TableCell>
                  <TableCell className="font-medium text-sm">{u.username}</TableCell>
                  <TableCell className="text-sm">{u.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", getRoleBadgeClass(u.role))}
                    >
                      {getRoleDisplay(u.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        u.active
                          ? "bg-primary/5 text-primary border border-primary/20"
                          : "bg-red-50 text-red-600 border border-red-200"
                      )}
                    >
                      {u.active ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(u.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-sky-500 hover:text-sky-600"
                        title="Edit User"
                        onClick={() => openEditDialog(u)}
                        disabled={u.id === currentUserId}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Ganti Password"
                        onClick={() => setChangePwForUser({ id: u.id, name: u.name })}
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8",
                          u.active
                            ? "text-orange-500 hover:text-orange-600"
                            : "text-primary hover:text-primary/80"
                        )}
                        title={u.active ? "Nonaktifkan" : "Aktifkan"}
                        onClick={() => toggleMutation.mutate(u.id)}
                        disabled={toggleMutation.isPending || u.id === currentUserId}
                      >
                        {toggleMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : u.active ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Hapus User"
                        onClick={() => {
                          deleteIdRef.current = u.id;
                          setDeleteTarget(u);
                        }}
                        disabled={u.id === currentUserId}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Add User Dialog ── */}
      <Dialog
        open={addOpen}
        onOpenChange={(v) => {
          if (!v) resetAddForm();
          setAddOpen(v);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah User</DialogTitle>
            <DialogDescription>Tambahkan pengguna baru ke sistem.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="add-username">Username</Label>
              <Input
                id="add-username"
                placeholder="Username untuk login"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                disabled={addMutation.isPending}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-name">Nama Lengkap</Label>
              <Input
                id="add-name"
                placeholder="Nama lengkap"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={addMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Password</Label>
              <div className="relative">
                <Input
                  id="add-password"
                  type={showNewPw ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={addMutation.isPending}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <RoleSelect
              value={newRole}
              onValueChange={setNewRole}
              customValue={newRoleCustom}
              onCustomValueChange={setNewRoleCustom}
              id="add-role-custom"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { resetAddForm(); setAddOpen(false); }}
              disabled={addMutation.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleAdd}
              disabled={addMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {addMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit User Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Ubah nama dan/atau role pengguna.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={users.find((u) => u.id === editId)?.username || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Username tidak dapat diubah setelah dibuat.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Lengkap</Label>
              <Input
                id="edit-name"
                placeholder="Nama lengkap"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={editMutation.isPending}
              />
            </div>
            <RoleSelect
              value={editRole}
              onValueChange={setEditRole}
              customValue={editRoleCustom}
              onCustomValueChange={setEditRoleCustom}
              id="edit-role-custom"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={editMutation.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={handleEdit}
              disabled={editMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {editMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus User?</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus user{" "}
              <strong>{deleteTarget?.name}</strong> (
              <span className="text-xs">{deleteTarget?.username}</span>)?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                const id = deleteIdRef.current;
                if (id) deleteMutation.mutate(id);
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change Password for other user ── */}
      <ChangePasswordDialog
        open={!!changePwForUser}
        onOpenChange={(open) => {
          if (!open) setChangePwForUser(null);
        }}
        targetUserId={changePwForUser?.id}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["users-list"] })}
      />
    </div>
  );
}