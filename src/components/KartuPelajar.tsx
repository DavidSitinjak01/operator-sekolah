"use client";

import { useRef } from "react";
import { Printer, X, School, QrCode, CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// ── Types ────────────────────────────────────────────────────────────────────

export interface KartuPelajarSiswa {
  id: string;
  nama: string;
  nipd: string;
  nisn: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  nik: string;
  agama: string;
  alamat: string;
  rt: string;
  rw: string;
  dusun: string;
  kelurahan: string;
  kecamatan: string;
  kodePos: string;
  telepon: string;
  hp: string;
  namaAyah: string;
  namaIbu: string;
  namaWali: string;
  rombel: string;
  tahunPelajaran: string;
  semester: string;
  kebutuhanKhusus: string;
  beratBadan: string;
  tinggiBadan: string;
  golonganDarah?: string;
}

interface KartuPelajarDialogProps {
  open: boolean;
  onClose: () => void;
  siswa: KartuPelajarSiswa | null;
}

// ── School Config ────────────────────────────────────────────────────────────

const SEKOLAH = {
  nama: "SMA NEGERI 1 GIDO",
  npsn: "10200955",
  alamat: "Jl. Pelajar No. 1, Desa Bawodesolo, Kec. Gido",
  kabupaten: "Kabupaten Nias",
  provinsi: "Provinsi Sumatera Utara",
  kodePos: "22862",
  telepon: "(0639) 123456",
  email: "sman1gido@gmail.com",
  website: "www.sman1gido.sch.id",
  kepalaSekolah: "Drs. YAFETI HIA, M.Pd",
  nipKepsek: "196805151993031007",
  akreditasi: "A",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTglLahir(tempat: string, tgl: string): string {
  const parts = [];
  if (tempat) parts.push(tempat);
  if (tgl) {
    try {
      const d = new Date(tgl);
      if (!isNaN(d.getTime())) {
        const bulan = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni",
          "Juli", "Agustus", "September", "Oktober", "November", "Desember",
        ];
        parts.push(`${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`);
      } else {
        parts.push(tgl);
      }
    } catch {
      parts.push(tgl);
    }
  }
  return parts.join(", ");
}

function formatAlamat(s: KartuPelajarSiswa): string {
  const parts = [];
  if (s.alamat) parts.push(s.alamat);
  const rtRw = [s.rt, s.rw].filter(Boolean).join("/");
  if (rtRw) parts.push(`RT ${rtRw}`);
  if (s.dusun) parts.push(`Dusun ${s.dusun}`);
  if (s.kelurahan) parts.push(`Desa/Kel. ${s.kelurahan}`);
  if (s.kecamatan) parts.push(`Kec. ${s.kecamatan}`);
  if (s.kodePos) parts.push(s.kodePos);
  return parts.join(", ") || "-";
}

function getKelasAngkatan(rombel: string): string {
  // X → 10, XI → 11, XII → 12
  if (!rombel) return "-";
  const match = rombel.match(/^(X{1,3}|I{1,3}V?|VI{0,2})\s/);
  if (!match) return rombel;
  const roman = match[1];
  const map: Record<string, string> = {
    X: "10", XI: "11", XII: "12",
    I: "10", II: "11", III: "12",
    IV: "11", V: "12", VI: "12",
  };
  return map[roman] || roman;
}

function getJurusan(rombel: string): string {
  if (!rombel) return "-";
  // If rombel has IPA/IPS suffix
  if (rombel.toUpperCase().includes("IPA")) return "IPA";
  if (rombel.toUpperCase().includes("IPS")) return "IPS";
  return "Umum";
}

// ── Info Row Helper ──────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="font-medium text-[11px] text-gray-700 w-[120px] shrink-0">{label}</span>
      <span className="text-[11px] text-gray-600">: </span>
      <span className="text-[11px] text-gray-800 flex-1">{value || "-"}</span>
    </div>
  );
}

// ── Kartu Pelajar Card (Printable) ──────────────────────────────────────────

function KartuPelajarCard({ siswa }: { siswa: KartuPelajarSiswa }) {
  const kelasAngkatan = getKelasAngkatan(siswa.rombel);
  const jurusan = getJurusan(siswa.rombel);
  const berlakuSampai = siswa.tahunPelajaran
    ? `${parseInt(siswa.tahunPelajaran.split("/")[0]) + 1}/06/30`
    : "-";

  // Wali/orang tua yang ditampilkan
  const namaOrtu = siswa.namaAyah || siswa.namaWali || siswa.namaIbu || "-";

  return (
    <div className="kartu-pelajar-card bg-white border border-gray-300 shadow-lg mx-auto" style={{ width: "340px" }}>
      {/* ─── OUTER BORDER (double line effect) ─── */}
      <div className="border-2 border-emerald-700 m-[6px] p-0">
        {/* ─── HEADER: School Identity ─── */}
        <div className="bg-emerald-700 px-4 py-2.5 text-center">
          <p className="text-[10px] text-emerald-100 tracking-wide uppercase">Yayasan Pendidikan Daerah</p>
          <h1 className="text-[16px] font-bold text-white tracking-wide leading-tight mt-0.5">{SEKOLAH.nama}</h1>
          <div className="flex items-center justify-center gap-3 mt-1 text-[9px] text-emerald-200">
            <span>NPSN: {SEKOLAH.npsn}</span>
            <span>|</span>
            <span>Akreditasi: <strong className="text-white">{SEKOLAH.akreditasi}</strong></span>
          </div>
          <p className="text-[8px] text-emerald-200 mt-0.5">{SEKOLAH.alamat}</p>
          <p className="text-[8px] text-emerald-200">{SEKOLAH.kabupaten}, {SEKOLAH.provinsi} {SEKOLAH.kodePos}</p>
        </div>

        {/* ─── TITLE: Kartu Pelajar ─── */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 py-1.5 text-center border-b-2 border-amber-400">
          <div className="flex items-center justify-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-300" />
            <h2 className="text-[14px] font-extrabold text-white tracking-[0.15em] uppercase">Kartu Pelajar</h2>
            <CreditCard className="w-4 h-4 text-amber-300" />
          </div>
          <p className="text-[8px] text-emerald-100 -mt-0.5">Tahun Pelajaran {siswa.tahunPelajaran || "-"}</p>
        </div>

        {/* ─── BODY ─── */}
        <div className="p-4 flex gap-4">
          {/* LEFT: Photo & Quick Info */}
          <div className="shrink-0 flex flex-col items-center">
            {/* Photo placeholder */}
            <div className="w-[96px] h-[120px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-sm flex flex-col items-center justify-center text-gray-400 relative overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <p className="text-[7px] text-gray-400 mt-1">Pas Foto</p>
                <p className="text-[7px] text-gray-400">3x4</p>
              </div>
            </div>

            {/* Quick info below photo */}
            <div className="mt-2 text-center space-y-0.5">
              <p className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200">
                Kelas {siswa.rombel || "-"}
              </p>
              <p className="text-[8px] text-gray-500">
                No. Absen: <span className="font-semibold text-gray-700">{siswa.nipd || "-"}</span>
              </p>
            </div>
          </div>

          {/* RIGHT: Student Data */}
          <div className="flex-1 space-y-[3px] min-w-0">
            {/* Nama (bold, larger) */}
            <div className="mb-1">
              <p className="text-[9px] text-gray-500 uppercase tracking-wide">Nama Lengkap</p>
              <p className="text-[13px] font-bold text-gray-900 leading-tight uppercase tracking-wide">{siswa.nama || "-"}</p>
            </div>

            <InfoRow label="NIS / NIPD" value={siswa.nipd} />
            <InfoRow label="NISN" value={siswa.nisn} />
            <InfoRow label="NIK" value={siswa.nik} />
            <InfoRow label="Tempat, Tgl Lahir" value={formatTglLahir(siswa.tempatLahir, siswa.tanggalLahir)} />
            <InfoRow label="Jenis Kelamin" value={siswa.jenisKelamin === "L" ? "Laki-laki" : siswa.jenisKelamin === "P" ? "Perempuan" : siswa.jenisKelamin || "-"} />
            <InfoRow label="Agama" value={siswa.agama} />
            <InfoRow label="Kelas / Jurusan" value={`${kelasAngkatan} / ${jurusan}`} />
            <InfoRow label="Rombongan Belajar" value={siswa.rombel} />
          </div>
        </div>

        {/* ─── ALAMAT SECTION ─── */}
        <div className="px-4 pb-3">
          <div className="bg-gray-50 rounded-sm border border-gray-200 px-3 py-2">
            <p className="text-[8px] text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Alamat Tinggal</p>
            <p className="text-[10px] text-gray-800 leading-relaxed">{formatAlamat(siswa)}</p>
            <div className="flex gap-4 mt-1">
              <span className="text-[9px] text-gray-500">Telp: <span className="text-gray-700 font-medium">{siswa.telepon || siswa.hp || "-"}</span></span>
              {siswa.hp && (
                <span className="text-[9px] text-gray-500">HP: <span className="text-gray-700 font-medium">{siswa.hp}</span></span>
              )}
            </div>
          </div>
        </div>

        <Separator className="mx-4" />

        {/* ─── ORANG TUA / WALI SECTION ─── */}
        <div className="px-4 py-2">
          <p className="text-[8px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Data Orang Tua / Wali</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-[2px]">
            <InfoRow label="Nama Ayah" value={siswa.namaAyah} />
            <InfoRow label="Nama Ibu" value={siswa.namaIbu} />
            <InfoRow label="Nama Wali" value={siswa.namaWali} />
            <div />
          </div>
        </div>

        <Separator className="mx-4" />

        {/* ─── FOOTER: Signature & Validity ─── */}
        <div className="px-4 py-3">
          <div className="flex items-start justify-between">
            {/* Left: Validity */}
            <div className="space-y-1">
              <div>
                <p className="text-[8px] text-gray-500 uppercase tracking-wide">Berlaku Mulai</p>
                <p className="text-[10px] font-semibold text-gray-800">
                  {siswa.tahunPelajaran ? `${siswa.tahunPelajaran.split("/")[0]}/07/01` : "-"}
                </p>
              </div>
              <div>
                <p className="text-[8px] text-gray-500 uppercase tracking-wide">Berlaku Sampai</p>
                <p className="text-[10px] font-semibold text-gray-800">{berlakuSampai}</p>
              </div>
            </div>

            {/* Right: Kepala Sekolah signature */}
            <div className="text-center">
              <p className="text-[8px] text-gray-500">Gido, Juli 2025</p>
              <p className="text-[8px] text-gray-500">Kepala Sekolah</p>
              <div className="w-[120px] h-[40px] flex items-center justify-center mt-1">
                <p className="text-[8px] text-gray-400 italic">(Tanda Tangan & Stempel)</p>
              </div>
              <div className="border-b border-gray-800 w-[120px] mx-auto" />
              <p className="text-[9px] font-bold text-gray-800 mt-0.5 leading-tight">{SEKOLAH.kepalaSekolah}</p>
              <p className="text-[7px] text-gray-500">NIP. {SEKOLAH.nipKepsek}</p>
            </div>
          </div>
        </div>

        {/* ─── BOTTOM BAR ─── */}
        <div className="bg-emerald-700 px-4 py-1.5 flex items-center justify-between">
          <p className="text-[7px] text-emerald-200">{SEKOLAH.nama} — {SEKOLAH.alamat}</p>
          <div className="flex items-center gap-1 text-emerald-200">
            <QrCode className="w-3 h-3" />
            <span className="text-[7px]">{siswa.nisn || siswa.nipd || "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dialog Wrapper ───────────────────────────────────────────────────────────

export default function KartuPelajarDialog({ open, onClose, siswa }: KartuPelajarDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=450,height=800");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kartu Pelajar - ${siswa?.nama || "Siswa"}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page {
            size: auto;
            margin: 5mm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            padding: 10px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 300);
          };
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!siswa) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden max-h-[95vh]">
        <DialogHeader className="sr-only">
          <DialogTitle>Kartu Pelajar</DialogTitle>
          <DialogDescription>
            Cetak kartu pelajar untuk {siswa.nama}
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b no-print">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-700">Kartu Pelajar</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
              onClick={handlePrint}
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak
            </Button>
          </div>
        </div>

        {/* Card Preview */}
        <div className="p-4 overflow-y-auto max-h-[calc(95vh-120px)] flex justify-center">
          <div ref={cardRef}>
            <KartuPelajarCard siswa={siswa} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}