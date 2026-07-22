import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── Color constants ─────────────────────────────────────────────────────────
const KODE_COLORS: Record<string, { fg: string; bg: string }> = {
  H: { fg: "16A34A", bg: "F0FDF4" },
  S: { fg: "D97706", bg: "FFFBEB" },
  I: { fg: "2563EB", bg: "EFF6FF" },
  A: { fg: "DC2626", bg: "FEF2F2" },
};

const WEEKEND_BG = "FED7AA";
const WEEKEND_FG = "78350F";
const HEADER_BG = "E2E8F0";
const HEADER_FG = "1E293B";
const TITLE_FG = "0F172A";

// ─── Block categories (same as frontend) ────────────────────────────────────
const BLOCK_CATEGORIES = [
  "Libur Nasional", "Libur Khusus", "Libur Semester",
  "Penyerahan Rapor", "Hari Pendidikan Nasional", "Weekend",
];

const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const HARI_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

// ─── GET: Export absensi as Excel ───────────────────────────────────────────
// Query params: tahunPelajaran, semester, rombel, bulan (YYYY-MM)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as { role?: string })?.role || "";
    if (role !== "admin" && role !== "operator") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tahunPelajaran = searchParams.get("tahunPelajaran") || "";
    const semester = searchParams.get("semester") || "Ganjil";
    const rombel = searchParams.get("rombel") || "";
    const bulan = searchParams.get("bulan") || "";

    if (!tahunPelajaran || !rombel || !bulan) {
      return NextResponse.json({ error: "tahunPelajaran, rombel, dan bulan wajib" }, { status: 400 });
    }

    const [yearStr, monthStr] = bulan.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const daysInMonth = getDaysInMonth(year, month);

    // ─── Fetch school settings ────────────────────────────────────────────
    const settings = await db.pengaturan.findMany({
      where: { key: { in: ["namaSekolah", "alamat", "kabupaten", "kecamatan", "kode_absensi"] } },
    });
    const settingsMap: Record<string, string> = {};
    for (const s of settings) settingsMap[s.key] = s.value;
    const namaSekolah = settingsMap.namaSekolah || "SMA NEGERI 1 GIDO";
    const alamat = settingsMap.alamat || "";
    const kabupaten = settingsMap.kabupaten || "";

    // ─── Parse kode absensi config ────────────────────────────────────────
    let kodeConfig: { kode: string; label: string }[] = [
      { kode: "H", label: "Hadir" },
      { kode: "S", label: "Sakit" },
      { kode: "I", label: "Izin" },
      { kode: "A", label: "Alpa" },
    ];
    if (settingsMap.kode_absensi) {
      try {
        kodeConfig = JSON.parse(settingsMap.kode_absensi);
      } catch { /* use defaults */ }
    }

    // ─── Fetch hari libur for this month ──────────────────────────────────
    const hariLiburList = await db.hariLibur.findMany({
      where: {
        tahunPelajaran,
        tanggal: { startsWith: bulan },
      },
    });
    const hariLiburMap: Record<string, { kategori: string; label: string }> = {};
    for (const h of hariLiburList) {
      hariLiburMap[h.tanggal] = { kategori: h.kategori, label: h.label };
    }

    // ─── Fetch siswa (from AbsensiSiswa — INDEPENDEN) ──────────────────────────
    const siswaList = await db.absensiSiswa.findMany({
      where: { tahunPelajaran, semester, rombel },
      orderBy: { no: "asc" },
    });
    // Numeric sort
    const sortedSiswa = siswaList.sort((a, b) => (parseInt(a.no) || 0) - (parseInt(b.no) || 0));

    // ─── Student gender counts ────────────────────────────────────────────
    const jumlahL = sortedSiswa.filter((s) => s.jenisKelamin === "L").length;
    const jumlahP = sortedSiswa.filter((s) => s.jenisKelamin === "P").length;
    const jumlahTotal = sortedSiswa.length;

    // ─── Fetch absensi data ────────────────────────────────────────────────
    const absensiList = await db.absensi.findMany({
      where: {
        tahunPelajaran,
        semester,
        rombel,
        tanggal: { startsWith: bulan },
      },
    });
    const absensiMap: Record<string, string> = {};
    for (const a of absensiList) {
      absensiMap[`${a.siswaId}-${a.tanggal}`] = a.kodeAbsensi;
    }

    // ─── Build Excel using xlsx (SheetJS) ────────────────────────────────
    const XLSX = await import("xlsx");

    const wb = XLSX.utils.book_new();

    // Build data rows
    const aoa: (string | number | null)[][] = [];

    // Title rows
    aoa.push([namaSekolah.toUpperCase()]);
    if (alamat || kabupaten) {
      const locParts = [alamat, kabupaten].filter(Boolean);
      aoa.push([locParts.join(", ")]);
    }
    aoa.push([]); // blank

    aoa.push([`LEMBAR ABSENSI SISWA`]);
    aoa.push([`Kelas: ${rombel}`, `Jumlah Siswa: ${jumlahTotal} (L: ${jumlahL}, P: ${jumlahP})`]);
    aoa.push([`Tahun Pelajaran: ${tahunPelajaran} — Semester ${semester}`]);
    aoa.push([`Bulan: ${BULAN_NAMES[month - 1]} ${year}`]);
    aoa.push([]); // blank

    // Header row 1: Kode tanggal (just dates)
    const headerRow1: (string | number | null)[] = ["No", "Nama Siswa"];
    const headerRow2: (string | number | null)[] = ["", ""]; // day names row
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = getDayOfWeek(year, month, d);
      headerRow1.push(d);
      headerRow2.push(HARI_NAMES[dow]);
    }
    // Summary columns
    for (const k of kodeConfig) {
      headerRow1.push(k.kode);
      headerRow2.push(k.label);
    }
    aoa.push(headerRow1);
    aoa.push(headerRow2);

    // Body rows
    for (let idx = 0; idx < sortedSiswa.length; idx++) {
      const siswa = sortedSiswa[idx];
      const row: (string | number | null)[] = [idx + 1, siswa.nama];

      const summary: Record<string, number> = {};
      for (const k of kodeConfig) summary[k.kode] = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const tanggal = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dow = getDayOfWeek(year, month, d);
        const isWeekend = dow === 0 || dow === 6;
        const liburInfo = hariLiburMap[tanggal];
        const isBlockedLibur = !!liburInfo && BLOCK_CATEGORIES.includes(liburInfo.kategori);

        if (isWeekend || isBlockedLibur) {
          row.push(isWeekend ? "✕" : (liburInfo?.label.length > 4 ? liburInfo.label.slice(0, 3) + "…" : liburInfo?.label || "—"));
        } else {
          const kode = absensiMap[`${siswa.id}-${tanggal}`] || "";
          row.push(kode || "");
          if (kode && kode in summary) summary[kode]++;
        }
      }

      // Summary
      for (const k of kodeConfig) {
        row.push(summary[k.kode]);
      }

      aoa.push(row);
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // ─── Styling ──────────────────────────────────────────────────────────
    // Column widths
    const colWidths: { wch: number }[] = [
      { wch: 5 },  // No
      { wch: 25 }, // Nama
      ...Array(daysInMonth).fill(null).map(() => ({ wch: 5 })), // date columns
      ...kodeConfig.map(() => ({ wch: 5 })), // summary columns
    ];
    ws["!cols"] = colWidths;

    // Merge title cells
    const totalCols = 2 + daysInMonth + kodeConfig.length;
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }, // school name
      { s: { r: 3, c: 0 }, e: { r: 3, c: totalCols - 1 } }, // "LEMBAR ABSENSI SISWA"
    ];

    // Apply cell styles
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[addr];
        if (!cell) continue;

        if (!cell.s) cell.s = {};

        const isTitle = R <= 1 || R === 3;
        const isSubInfo = R >= 4 && R <= 7;
        const isHeader = R === 8 || R === 9;
        const isBody = R >= 10;

        if (isTitle) {
          cell.s = {
            font: { bold: true, sz: 14, color: { rgb: TITLE_FG } },
            alignment: { horizontal: "center", vertical: "center" },
          };
        } else if (isSubInfo) {
          const isRightAligned = R === 4 && C === 1;
          cell.s = {
            font: { bold: true, sz: 11, color: { rgb: TITLE_FG } },
            alignment: { horizontal: isRightAligned ? "right" : "left", vertical: "center" },
          };
        } else if (isHeader) {
          cell.s = {
            font: { bold: true, sz: 9, color: { rgb: HEADER_FG } },
            fill: { fgColor: { rgb: HEADER_BG } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: {
              top: { style: "thin", color: { rgb: "CBD5E1" } },
              bottom: { style: "thin", color: { rgb: "CBD5E1" } },
              left: { style: "thin", color: { rgb: "CBD5E1" } },
              right: { style: "thin", color: { rgb: "CBD5E1" } },
            },
          };
        } else if (isBody) {
          // Check if this is a date column (C >= 2 && C < 2 + daysInMonth)
          const isDateCol = C >= 2 && C < 2 + daysInMonth;
          const dayNum = isDateCol ? C - 1 : 0; // day number (1-based)
          const tanggal = isDateCol ? `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}` : "";
          const dow = isDateCol ? getDayOfWeek(year, month, dayNum) : 0;
          const isWeekend = isDateCol && (dow === 0 || dow === 6);
          const liburInfo = isDateCol ? hariLiburMap[tanggal] : null;
          const isBlockedLibur = !!liburInfo && BLOCK_CATEGORIES.includes(liburInfo.kategori);
          const isSummaryCol = C >= 2 + daysInMonth;

          if (isDateCol && (isWeekend || isBlockedLibur)) {
            cell.s = {
              font: { sz: 9, color: { rgb: WEEKEND_FG } },
              fill: { fgColor: { rgb: WEEKEND_BG } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "E2E8F0" } },
                bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                left: { style: "thin", color: { rgb: "E2E8F0" } },
                right: { style: "thin", color: { rgb: "E2E8F0" } },
              },
            };
          } else if (isDateCol) {
            const val = String(cell.v || "");
            const kodeColor = KODE_COLORS[val];
            cell.s = {
              font: { bold: !!val, sz: 9, color: { rgb: kodeColor?.fg || "64748B" } },
              fill: kodeColor ? { fgColor: { rgb: kodeColor.bg } } : undefined,
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "E2E8F0" } },
                bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                left: { style: "thin", color: { rgb: "E2E8F0" } },
                right: { style: "thin", color: { rgb: "E2E8F0" } },
              },
            };
          } else if (isSummaryCol) {
            const summaryIdx = C - (2 + daysInMonth);
            const kc = kodeConfig[summaryIdx];
            const sc = kc ? KODE_COLORS[kc.kode] : null;
            cell.s = {
              font: { bold: true, sz: 9, color: { rgb: sc?.fg || "64748B" } },
              fill: sc ? { fgColor: { rgb: sc.bg } } : undefined,
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "E2E8F0" } },
                bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                left: { style: "thin", color: { rgb: "E2E8F0" } },
                right: { style: "thin", color: { rgb: "E2E8F0" } },
              },
            };
          } else {
            // No or Nama column
            cell.s = {
              font: { sz: 9, color: { rgb: "334155" } },
              alignment: { horizontal: C === 0 ? "center" : "left", vertical: "center" },
              border: {
                top: { style: "thin", color: { rgb: "E2E8F0" } },
                bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                left: { style: "thin", color: { rgb: "E2E8F0" } },
                right: { style: "thin", color: { rgb: "E2E8F0" } },
              },
            };
          }
        }
      }
    }

    // Row heights for title
    ws["!rows"] = [
      { hpt: 24 }, // row 0 - school name
      { hpt: 16 }, // row 1 - address
      { hpt: 8 },  // row 2 - blank
      { hpt: 20 }, // row 3 - title
      { hpt: 16 }, // row 4 - class
      { hpt: 16 }, // row 5 - TP
      { hpt: 16 }, // row 6 - month
      { hpt: 8 },  // row 7 - blank
      { hpt: 22 }, // row 8 - header 1
      { hpt: 20 }, // row 9 - header 2
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Absensi");

    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileName = `Absensi_${rombel.replace(/\s+/g, "_")}_${BULAN_NAMES[month - 1]}_${year}.xlsx`;

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("[ABSENSI EXPORT]", error);
    return NextResponse.json({ error: "Gagal mengekspor absensi" }, { status: 500 });
  }
}
