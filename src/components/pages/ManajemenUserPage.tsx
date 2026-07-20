'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  Users, Plus, Pencil, Trash2, Loader2, KeyRound,
  UserPlus, Shield, UserCheck, UserX, Eye, EyeOff, Save, X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const ROLES = [
  { value: 'admin', label: 'Administrator', color: 'bg-red-100 text-red-700' },
  { value: 'operator', label: 'Operator', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'kesiswaan', label: 'Kesiswaan', color: 'bg-blue-100 text-blue-700' },
  { value: 'kurikulum', label: 'Kurikulum', color: 'bg-amber-100 text-amber-700' },
  { value: 'kepala_sekolah', label: 'Kepala Sekolah', color: 'bg-purple-100 text-purple-700' },
  { value: 'tata_usaha', label: 'Tata Usaha', color: 'bg-orange-100 text-orange-700' },
  { value: 'perpustakaan', label: 'Perpustakaan', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'bk', label: 'Bimbingan Konseling', color: 'bg-pink-100 text-pink-700' },
] as const;

function getRoleBadge(role: string) {
  const r = ROLES.find((r) => r.value === role);
  return r ? { label: r.label, color: r.color } : { label: role, color: 'bg-gray-100 text-gray-700' };
}

interface UserRow {
  id: string;
  username: string;
  nama: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export default function ManajemenUserPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const qc = useQueryClient();
  const currentUserRole = (session?.user as { role?: string })?.role || '';

  // Only admin can access
  if (currentUserRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Akses Ditolak</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Halaman manajemen user hanya dapat diakses oleh <strong>Administrator</strong>.
        </p>
      </div>
    );
  }

  return <UserManagementContent />;
}

function UserManagementContent() {
  const { toast } = useToast();
  const qc = useQueryClient();

  // ─── State ───────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [showPasswords, setShowPasswords] = useState({ add: false, reset: false });

  // ─── Fetch users ─────────────────────────────────
  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/user');
      if (!res.ok) throw new Error('Gagal memuat');
      return res.json();
    },
  });

  // ─── Mutations ───────────────────────────────────
  const addMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; nama: string; role: string }) => {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menambah');
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setAddOpen(false);
      toast({ title: 'Berhasil', description: 'User baru berhasil ditambahkan' });
    },
    onError: (err) => toast({ title: 'Gagal', description: err.message, variant: 'destructive' }),
  });

  const editMutation = useMutation({
    mutationFn: async (data: Partial<UserRow>) => {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal mengupdate');
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
      toast({ title: 'Berhasil', description: 'Data user berhasil diperbarui' });
    },
    onError: (err) => toast({ title: 'Gagal', description: err.message, variant: 'destructive' }),
  });

  const resetMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, newPassword }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal reset password');
      return result;
    },
    onSuccess: () => {
      setResetUser(null);
      toast({ title: 'Berhasil', description: 'Password berhasil direset' });
    },
    onError: (err) => toast({ title: 'Gagal', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menghapus');
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setDeleteUser(null);
      toast({ title: 'Berhasil', description: 'User berhasil dihapus' });
    },
    onError: (err) => toast({ title: 'Gagal', description: err.message, variant: 'destructive' }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (user: UserRow) => {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, active: !user.active }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal mengubah status');
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast({ title: 'Gagal', description: err.message, variant: 'destructive' }),
  });

  // ─── Loading ─────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Manajemen User
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola akun pengguna yang dapat mengakses sistem
          </p>
        </div>
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Tambah User
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daftar User</CardTitle>
          <CardDescription>Total {users.length} akun pengguna terdaftar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 text-center">No</TableHead>
                  <TableHead>Nama / Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Tanggal Dibuat</TableHead>
                  <TableHead className="w-[140px] text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Belum ada user terdaftar
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, index) => {
                    const badge = getRoleBadge(user.role);
                    return (
                      <TableRow key={user.id} className={!user.active ? 'opacity-50' : ''}>
                        <TableCell className="text-center font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{user.nama || user.username}</p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={badge.color}>
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}
                          >
                            {user.active ? (
                              <><UserCheck className="w-3 h-3 mr-1" />Aktif</>
                            ) : (
                              <><UserX className="w-3 h-3 mr-1" />Nonaktif</>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleActiveMutation.mutate(user)}
                              title={user.active ? 'Nonaktifkan' : 'Aktifkan'}
                              disabled={toggleActiveMutation.isPending}
                            >
                              {user.active ? <UserX className="h-4 w-4 text-orange-500" /> : <UserCheck className="h-4 w-4 text-emerald-500" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                              onClick={() => setEditUser(user)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-amber-100 hover:text-amber-600"
                              onClick={() => { setResetUser(user); setShowPasswords((p) => ({ ...p, reset: false })); }}
                              title="Reset Password"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteUser(user)}
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Add User Dialog ─── */}
      <AddUserDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(data) => addMutation.mutate(data)}
        loading={addMutation.isPending}
        showPassword={showPasswords.add}
        onTogglePassword={() => setShowPasswords((p) => ({ ...p, add: !p.add }))}
      />

      {/* ─── Edit User Dialog ─── */}
      <EditUserDialog
        user={editUser}
        onClose={() => setEditUser(null)}
        onSubmit={(data) => editMutation.mutate(data)}
        loading={editMutation.isPending}
      />

      {/* ─── Reset Password Dialog ─── */}
      <ResetPasswordDialog
        user={resetUser}
        onClose={() => setResetUser(null)}
        onSubmit={(data) => resetMutation.mutate(data)}
        loading={resetMutation.isPending}
        showPassword={showPasswords.reset}
        onTogglePassword={() => setShowPasswords((p) => ({ ...p, reset: !p.reset }))}
      />

      {/* ─── Delete Confirmation ─── */}
      <AlertDialog open={!!deleteUser} onOpenChange={(v) => !v && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User?</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus user <strong>@{deleteUser?.username}</strong> ({deleteUser?.nama})?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Add User Dialog ────────────────────────────────────────────────────────────

function AddUserDialog({ open, onClose, onSubmit, loading, showPassword, onTogglePassword }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { username: string; password: string; nama: string; role: string }) => void;
  loading: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
}) {
  const [form, setForm] = useState({ username: '', password: '', nama: '', role: 'operator' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    setForm({ username: '', password: '', nama: '', role: 'operator' });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            Tambah User Baru
          </DialogTitle>
          <DialogDescription>Tambahkan akun pengguna baru untuk mengakses sistem.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-nama">Nama Lengkap</Label>
            <Input
              id="add-nama"
              placeholder="Contoh: Budi Santoso"
              value={form.nama}
              onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-username">Username</Label>
            <Input
              id="add-username"
              placeholder="Minimal 3 karakter"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
              minLength={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-password">Password</Label>
            <div className="relative">
              <Input
                id="add-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 6 karakter"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Role / Jabatan</Label>
            <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Tambah User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit User Dialog ───────────────────────────────────────────────────────────

function EditUserDialog({ user, onClose, onSubmit, loading }: {
  user: UserRow | null;
  onClose: () => void;
  onSubmit: (data: Partial<UserRow>) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({ nama: '', username: '', role: '' });

  // Sync when user changes
  if (user && (form.username !== user.username || form.nama !== user.nama || form.role !== user.role)) {
    setForm({ nama: user.nama, username: user.username, role: user.role });
  }

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ id: user.id, nama: form.nama, username: form.username, role: form.role });
  };

  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-emerald-600" />
            Edit User
          </DialogTitle>
          <DialogDescription>Ubah data user <strong>@{user.username}</strong></DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nama">Nama Lengkap</Label>
            <Input
              id="edit-nama"
              value={form.nama}
              onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-username">Username</Label>
            <Input
              id="edit-username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
              minLength={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Role / Jabatan</Label>
            <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reset Password Dialog ──────────────────────────────────────────────────────

function ResetPasswordDialog({ user, onClose, onSubmit, loading, showPassword, onTogglePassword }: {
  user: UserRow | null;
  onClose: () => void;
  onSubmit: (data: { id: string; newPassword: string }) => void;
  loading: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
}) {
  const [newPassword, setNewPassword] = useState('');

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ id: user.id, newPassword });
    setNewPassword('');
  };

  return (
    <Dialog open={!!user} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-600" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Atur ulang password untuk <strong>@{user.username}</strong> ({user.nama})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Password Baru</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Reset Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}