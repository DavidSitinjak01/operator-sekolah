'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, School, Upload, Loader2, ImageIcon, X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { compressImageToFile } from '@/lib/image-compress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface IdentitasSekolah {
  id: string;
  namaSekolah: string;
  npsn: string;
  alamat: string;
  logo: string;
  fotoSekolah: string;
}

export default function IdentitasSekolahDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const logoRef = useRef<HTMLInputElement>(null);
  const fotoRef = useRef<HTMLInputElement>(null);

  const { data: sekolah, isLoading } = useQuery<IdentitasSekolah>({
    queryKey: ['identitas-sekolah'],
    queryFn: async () => {
      const res = await fetch('/api/identitas-sekolah');
      if (!res.ok) throw new Error('Gagal memuat');
      return res.json();
    },
    enabled: open,
  });

  const [form, setForm] = useState({
    namaSekolah: '',
    npsn: '',
    alamat: '',
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [fotoPreview, setFotoPreview] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [compressing, setCompressing] = useState<string | null>(null); // 'logo' | 'foto' | null

  // Sync from server data
  const [synced, setSynced] = useState(false);
  if (sekolah && !synced) {
    setForm({
      namaSekolah: sekolah.namaSekolah || '',
      npsn: sekolah.npsn || '',
      alamat: sekolah.alamat || '',
    });
    setLogoPreview(sekolah.logo || '');
    setFotoPreview(sekolah.fotoSekolah || '');
    setSynced(true);
  }
  // Reset synced when dialog closes
  if (!open) {
    // We don't reset form here to keep data if reopened quickly
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('namaSekolah', form.namaSekolah);
      fd.append('npsn', form.npsn);
      fd.append('alamat', form.alamat);
      fd.append('logoExisting', logoPreview);
      fd.append('fotoSekolahExisting', fotoPreview);
      if (logoFile) fd.append('logo', logoFile);
      if (fotoFile) fd.append('fotoSekolah', fotoFile);

      const res = await fetch('/api/identitas-sekolah', {
        method: 'PUT',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['identitas-sekolah'] });
      qc.invalidateQueries({ queryKey: ['identitas-sekolah-sidebar'] });
      qc.invalidateQueries({ queryKey: ['identitas-sekolah-mobile'] });
      // Refresh favicon after logo change
      const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (link) link.href = '/icon?t=' + Date.now();
      toast({ title: 'Berhasil', description: 'Identitas sekolah berhasil disimpan' });
      setLogoFile(null);
      setFotoFile(null);
      onOpenChange(false);
    },
    onError: (err) => {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    },
  });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: 'File Terlalu Besar',
        description: `Ukuran logo maksimal 20MB (file Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }
    setCompressing('logo');
    try {
      const compressed = await compressImageToFile(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.85,
      });
      setLogoFile(compressed);
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(compressed);
      if (file.size > 200 * 1024) {
        toast({
          title: 'Logo Dikompres',
          description: `${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`,
        });
      }
    } catch {
      toast({ title: 'Gagal', description: 'Gagal mengkompresi logo', variant: 'destructive' });
    } finally {
      setCompressing(null);
    }
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: 'File Terlalu Besar',
        description: `Ukuran foto maksimal 20MB (file Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }
    setCompressing('foto');
    try {
      const compressed = await compressImageToFile(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
      });
      setFotoFile(compressed);
      const reader = new FileReader();
      reader.onload = (ev) => setFotoPreview(ev.target?.result as string);
      reader.readAsDataURL(compressed);
      if (file.size > 200 * 1024) {
        toast({
          title: 'Foto Dikompres',
          description: `${(file.size / 1024).toFixed(0)}KB → ${(compressed.size / 1024).toFixed(0)}KB`,
        });
      }
    } catch {
      toast({ title: 'Gagal', description: 'Gagal mengkompresi foto', variant: 'destructive' });
    } finally {
      setCompressing(null);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setLogoFile(null);
    if (logoRef.current) logoRef.current.value = '';
  };

  const handleRemoveFoto = () => {
    setFotoPreview('');
    setFotoFile(null);
    if (fotoRef.current) fotoRef.current.value = '';
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setSynced(false);
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <School className="h-4 w-4" />
            </span>
            Identitas Sekolah
          </DialogTitle>
          <DialogDescription>
            Atur identitas sekolah untuk kartu pelajar dan dokumen lainnya.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Nama Sekolah */}
            <div className="space-y-1.5">
              <Label htmlFor="namaSekolah">Nama Sekolah</Label>
              <Input
                id="namaSekolah"
                placeholder="Contoh: SMA NEGERI 1 TELUK DALAM"
                value={form.namaSekolah}
                onChange={(e) => setForm((f) => ({ ...f, namaSekolah: e.target.value }))}
              />
            </div>

            {/* NPSN */}
            <div className="space-y-1.5">
              <Label htmlFor="npsn">NPSN</Label>
              <Input
                id="npsn"
                placeholder="Nomor Pokok Sekolah Nasional"
                value={form.npsn}
                onChange={(e) => setForm((f) => ({ ...f, npsn: e.target.value }))}
              />
            </div>

            {/* Alamat */}
            <div className="space-y-1.5">
              <Label htmlFor="alamat">Alamat Sekolah</Label>
              <Input
                id="alamat"
                placeholder="Contoh: Kec. Teluk Dalam, Kab. Nias Selatan"
                value={form.alamat}
                onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
              />
            </div>

            {/* Logo */}
            <div className="space-y-1.5">
              <Label>Logo Sekolah</Label>
              <div className="flex items-center gap-3">
                <div className="relative h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                  {logoPreview ? (
                    <>
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="h-full w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={compressing === 'logo'}
                    onClick={() => logoRef.current?.click()}
                  >
                    {compressing === 'logo' ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {compressing === 'logo' ? 'Mengompres…' : 'Pilih Logo'}
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, SVG — otomatis dikompres</p>
                </div>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
            </div>

            {/* Foto Sekolah */}
            <div className="space-y-1.5">
              <Label>Foto Sekolah (Background Belakang Kartu)</Label>
              <div className="flex items-start gap-3">
                <div className="relative h-24 w-36 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                  {fotoPreview ? (
                    <>
                      <img
                        src={fotoPreview}
                        alt="Foto Sekolah"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveFoto}
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={compressing === 'foto'}
                    onClick={() => fotoRef.current?.click()}
                  >
                    {compressing === 'foto' ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {compressing === 'foto' ? 'Mengompres…' : 'Pilih Foto'}
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG — otomatis dikompres (background kartu)
                  </p>
                </div>
                <input
                  ref={fotoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFotoChange}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || isLoading || !!compressing}
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}