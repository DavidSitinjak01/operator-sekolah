'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ImportExcelDialogProps {
  type: 'siswa' | 'guru';
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export default function ImportExcelDialog({ type, onSuccess, children }: ImportExcelDialogProps) {
  const { tahunPelajaran, semester } = useAppStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    inserted: number;
    skipped: number;
    total: number;
    errors: string[];
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const title = type === 'siswa' ? 'Import Data Siswa' : 'Import Data Guru';
  const description = type === 'siswa'
    ? 'Upload file Excel (.xlsx/.xls) berisi data siswa.'
    : 'Upload file Excel (.xlsx/.xls) berisi data guru.';

  const resetState = useCallback(() => {
    setFile(null);
    setResult(null);
    setImporting(false);
    setDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) resetState();
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({
        title: 'Format Tidak Didukung',
        description: 'Gunakan file .xlsx, .xls, atau .csv',
        variant: 'destructive',
      });
      return;
    }
    setFile(selectedFile);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tahunPelajaran', tahunPelajaran);
      formData.append('semester', semester);

      const res = await fetch(`/api/${type}/import`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({
          success: false,
          message: data.error || 'Gagal melakukan import.',
          inserted: 0,
          skipped: 0,
          total: 0,
          errors: [],
        });
        toast({
          title: 'Import Gagal',
          description: data.error || 'Terjadi kesalahan saat import.',
          variant: 'destructive',
        });
      } else {
        setResult(data);
        toast({
          title: 'Import Berhasil',
          description: data.message,
        });
        onSuccess?.();
      }
    } catch {
      setResult({
        success: false,
        message: 'Terjadi kesalahan koneksi.',
        inserted: 0,
        skipped: 0,
        total: 0,
        errors: [],
      });
      toast({
        title: 'Import Gagal',
        description: 'Terjadi kesalahan koneksi ke server.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Import Excel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Info badge */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              Data akan diimport ke <strong>{tahunPelajaran}</strong> — Semester{' '}
              <strong>{semester}</strong>
            </span>
          </div>

          {/* Drop zone */}
          {!result && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer
                ${dragOver ? 'border-emerald-500 bg-emerald-50/50' : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30'}
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />

              {file ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                      <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Klik atau seret file Excel ke sini
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: .xlsx, .xls, atau .csv
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Column format hint */}
          {!result && (
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Format kolom Excel yang diharapkan:
              </p>
              {type === 'siswa' ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mendukung format Dapodik: No, Nama, NIPD, JK, NISN, Tempat Lahir, Tanggal Lahir, NIK, Agama, Alamat, RT, RW, Dusun, Kelurahan, Kecamatan, Kode Pos, Jenis Tinggal, Alat Transportasi, Telepon, HP, E-Mail, SKHUN, Penerima KPS, No. KPS, Nama Ayah, ..., Nama Ibu, ..., Nama Wali, ..., Rombel, Kebutuhan Khusus, Sekolah Asal, dan lainnya.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mendukung format Dapodik: No, Nama, NUPTK, JK, Tempat Lahir, Tanggal Lahir, NIP, Status Kepegawaian, Jenis PTK, Agama, Alamat Jalan, RT, RW, Nama Dusun, Desa/Kelurahan, Kecamatan, Kode Pos, Telepon, HP, Email, Tugas Tambahan, SK CPNS, Tanggal CPNS, SK Pengangkatan, TMT Pengangkatan, Lembaga Pengangkatan, Pangkat/Golongan, Sumber Gaji, dan lainnya.
                </p>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <div
              className={`rounded-lg border p-4 ${
                result.success ? 'border-emerald-200 bg-emerald-50/50' : 'border-destructive/20 bg-destructive/5'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{result.message}</p>
                  {result.success && result.total > 0 && (
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Total baris: <strong>{result.total}</strong></span>
                      <span>Berhasil: <strong className="text-emerald-600">{result.inserted}</strong></span>
                      {result.skipped > 0 && (
                        <span>Gagal: <strong className="text-destructive">{result.skipped}</strong></span>
                      )}
                    </div>
                  )}
                  {result.errors.length > 0 && (
                    <div className="mt-2 max-h-24 overflow-y-auto rounded bg-background/50 p-2">
                      {result.errors.map((err, i) => (
                        <p key={i} className="text-xs text-destructive">{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            {result && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Import Lagi
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              {result ? 'Tutup' : 'Batal'}
            </Button>
            {!result && (
              <Button
                size="sm"
                onClick={handleImport}
                disabled={!file || importing}
                className="gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengimport...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import Sekarang
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}