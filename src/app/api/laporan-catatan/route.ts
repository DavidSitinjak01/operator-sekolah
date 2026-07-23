import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET: Rekap catatan siswa per rombel untuk cetak ─────────────────────
// Query params: tahunPelajaran, semester, rombel
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tahunPelajaran = searchParams.get("tahunPelajaran") || "2025/2026";
    const semester = searchParams.get("semester") || "Ganjil";
    const rombel = searchParams.get("rombel") || "";

    if (!rombel) return NextResponse.json({ error: "rombel wajib" }, { status: 400 });

    // Fetch all catatan for this rombel
    const catatanList = await db.catatanSiswa.findMany({
      where: { tahunPelajaran, semester, rombel },
      orderBy: [{ siswaNama: "asc" }, { tanggal: "desc" }],
    });

    // Group by siswa
    const grouped: Record<string, {
      siswaId: string;
      siswaNama: string;
      nisn: string;
      rombel: string;
      catatan: { id: string; tanggal: string; kategori: string; catatan: string; tindakan: string; dibuatOleh: string; createdAt: string }[];
    }> = {};

    for (const c of catatanList) {
      if (!grouped[c.siswaId]) {
        grouped[c.siswaId] = {
          siswaId: c.siswaId,
          siswaNama: c.siswaNama,
          nisn: c.nisn,
          rombel: c.rombel,
          catatan: [],
        };
      }
      grouped[c.siswaId].catatan.push({
        id: c.id,
        tanggal: c.tanggal,
        kategori: c.kategori,
        catatan: c.catatan,
        tindakan: c.tindakan,
        dibuatOleh: c.dibuatOleh,
        createdAt: c.createdAt.toISOString(),
      });
    }

    // Convert to sorted array
    const summary = Object.values(grouped).sort((a, b) => a.siswaNama.localeCompare(b.siswaNama));

    // Count per category
    const kategoriCount: Record<string, number> = {};
    for (const c of catatanList) {
      kategoriCount[c.kategori] = (kategoriCount[c.kategori] || 0) + 1;
    }

    return NextResponse.json({
      rombel,
      tahunPelajaran,
      semester,
      tanggalCetak: new Date().toISOString(),
      totalCatatan: catatanList.length,
      totalSiswaDenganCatatan: summary.length,
      kategoriCount,
      summary,
    });
  } catch (error) {
    console.error("[LAPORAN CATATAN]", error);
    return NextResponse.json({ error: "Gagal memuat rekap catatan" }, { status: 500 });
  }
}
