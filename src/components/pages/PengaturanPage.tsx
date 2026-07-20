'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Loader2,
  Upload,
  Trash2,
  Save,
  School,
  MapPin,
  User,
  Building2,
  Hash,
  Award,
  ImagePlus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { invalidateSettingsCache } from '@/components/KartuPelajar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PengaturanData {
  logoSekolah: string;
  namaSekolah: string;
  npsn: string;
  alamat: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  kepalaSekolah: string;
  nipKepsek: string;
  akreditasi: string;
}

export default function PengaturanPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch settings
  const { data: settings, isLoading } = useQuery<PengaturanData>({
    queryKey: ['pengaturan'],
    queryFn: async () => {
      const res = await fetch('/api/pengaturan');
      if (!res.ok) throw new Error('Gagal memuat pengaturan');
      return res.json();
    },
  });

  // Form state
  const [form, setForm] = useState<Partial<PengaturanData>>({});
  const [deleteLogoOpen, setDeleteLogoOpen] = useState(false);

  // Sync settings to form when loaded
  const currentForm = settings || form;

  const updateField = (key: keyof PengaturanData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<PengaturanData>) => {
      const res = await fetch('/api/pengaturan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menyimpan');
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pengaturan'] });
      invalidateSettingsCache();
      setForm({});
      toast({ title: 'Berhasil', description: 'Pengaturan berhasil disimpan' });
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    },
  });

  // Logo upload mutation
  const logoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await fetch('/api/pengaturan/logo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal upload logo');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pengaturan'] });
      invalidateSettingsCache();
      toast({ title: 'Berhasil', description: 'Logo berhasil diupload' });
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    },
  });

  // Logo delete mutation
  const deleteLogoMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/pengaturan/logo', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus logo');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pengaturan'] });
      invalidateSettingsCache();
      setDeleteLogoOpen(false);
      toast({ title: 'Berhasil', description: 'Logo berhasil dihapus' });
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Format Tidak Didukung',
        description: 'Gunakan format JPG, PNG, GIF, atau WebP.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Ukuran Terlalu Besar',
        description: `Maksimal 5MB. File Anda ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
        variant: 'destructive',
      });
      return;
    }

    logoMutation.mutate(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  const hasChanges = Object.keys(form).length > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            Pengaturan Aplikasi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Konfigurasi identitas sekolah yang akan digunakan di seluruh aplikasi
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Simpan Pengaturan
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ─── LEFT: Logo Upload ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-emerald-600" />
              Logo Sekolah
            </CardTitle>
            <CardDescription>Upload logo sekolah (maks. 5MB). Format: JPG, PNG, GIF, WebP.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Logo Preview */}
              <div className="relative flex items-center justify-center w-full aspect-square max-w-[200px] mx-auto rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden">
                {currentForm.logoSekolah ? (
                  <img
                    src={currentForm.logoSekolah}
                    alt="Logo Sekolah"
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 p-4">
                    <School className="w-16 h-16 mb-2" />
                    <p className="text-sm text-center">Belum ada logo</p>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={logoMutation.isPending}
                >
                  {logoMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload Logo
                </Button>
                {currentForm.logoSekolah && (
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteLogoOpen(true)}
                    disabled={deleteLogoMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── RIGHT: Form Fields ─── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identitas Sekolah */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Identitas Sekolah
              </CardTitle>
              <CardDescription>Data identitas sekolah yang tampil di dokumen resmi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="namaSekolah" className="flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-muted-foreground" />
                  Nama Sekolah
                </Label>
                <Input
                  id="namaSekolah"
                  placeholder="Contoh: SMA NEGERI 1 GIDO"
                  value={form.namaSekolah !== undefined ? form.namaSekolah : (currentForm.namaSekolah || '')}
                  onChange={(e) => updateField('namaSekolah', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="npsn" className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                    NPSN
                  </Label>
                  <Input
                    id="npsn"
                    placeholder="Contoh: 10200955"
                    value={form.npsn !== undefined ? form.npsn : (currentForm.npsn || '')}
                    onChange={(e) => updateField('npsn', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="akreditasi" className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-muted-foreground" />
                    Akreditasi
                  </Label>
                  <Input
                    id="akreditasi"
                    placeholder="Contoh: A"
                    value={form.akreditasi !== undefined ? form.akreditasi : (currentForm.akreditasi || '')}
                    onChange={(e) => updateField('akreditasi', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamat" className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  Alamat Lengkap
                </Label>
                <Input
                  id="alamat"
                  placeholder="Contoh: Jl. Pelajar No. 1, Desa Bawodesolo, Kec. Gido"
                  value={form.alamat !== undefined ? form.alamat : (currentForm.alamat || '')}
                  onChange={(e) => updateField('alamat', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kabupaten">Kabupaten/Kota</Label>
                  <Input
                    id="kabupaten"
                    placeholder="Contoh: Kabupaten Nias"
                    value={form.kabupaten !== undefined ? form.kabupaten : (currentForm.kabupaten || '')}
                    onChange={(e) => updateField('kabupaten', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provinsi">Provinsi</Label>
                  <Input
                    id="provinsi"
                    placeholder="Contoh: Provinsi Sumatera Utara"
                    value={form.provinsi !== undefined ? form.provinsi : (currentForm.provinsi || '')}
                    onChange={(e) => updateField('provinsi', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kodePos">Kode Pos</Label>
                  <Input
                    id="kodePos"
                    placeholder="Contoh: 22862"
                    value={form.kodePos !== undefined ? form.kodePos : (currentForm.kodePos || '')}
                    onChange={(e) => updateField('kodePos', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kepala Sekolah */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                Kepala Sekolah
              </CardTitle>
              <CardDescription>Data penandatangan yang tampil di dokumen resmi seperti Kartu Pelajar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kepalaSekolah" className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  Nama Kepala Sekolah
                </Label>
                <Input
                  id="kepalaSekolah"
                  placeholder="Contoh: Drs. YAFETI HIA, M.Pd"
                  value={form.kepalaSekolah !== undefined ? form.kepalaSekolah : (currentForm.kepalaSekolah || '')}
                  onChange={(e) => updateField('kepalaSekolah', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nipKepsek" className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                  NIP Kepala Sekolah
                </Label>
                <Input
                  id="nipKepsek"
                  placeholder="Contoh: 196805151993031007"
                  value={form.nipKepsek !== undefined ? form.nipKepsek : (currentForm.nipKepsek || '')}
                  onChange={(e) => updateField('nipKepsek', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Logo Confirmation */}
      <AlertDialog open={deleteLogoOpen} onOpenChange={setDeleteLogoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Logo Sekolah?</AlertDialogTitle>
            <AlertDialogDescription>
              Logo sekolah akan dihapus dari sistem. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLogoMutation.mutate()}
              disabled={deleteLogoMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteLogoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}