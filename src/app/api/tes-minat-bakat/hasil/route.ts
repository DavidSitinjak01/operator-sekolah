import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── Helper: check admin/operator ───────────────────────────────────────────
async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const role = (session.user as { role?: string })?.role || "";
  if (role !== "admin" && role !== "operator") {
    return { session: null, error: NextResponse.json({ error: "Akses ditolak" }, { status: 403 }) };
  }
  return { session, error: null };
}

// ─── RIASEC dimensions ─────────────────────────────────────────────────────
const RIASEC_DIMENSIONS = ["R", "I", "A", "S", "E", "C"] as const;

// ─── GET: Fetch test results with summary statistics ────────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const tahunPelajaran = searchParams.get("tahunPelajaran") || "";
    const semester = searchParams.get("semester") || "";
    const rombel = searchParams.get("rombel") || "";
    const siswaId = searchParams.get("siswaId") || "";

    // Build where clause
    const where: Record<string, unknown> = {};
    if (tahunPelajaran) where.tahunPelajaran = tahunPelajaran;
    if (semester) where.semester = semester;
    if (rombel) where.rombel = rombel;
    if (siswaId) where.siswaId = siswaId;

    // ─── Single student mode ───────────────────────────────────────────────
    if (siswaId) {
      const result = await db.hasilTesMinatBakat.findFirst({
        where,
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({
        data: result || null,
        summary: null,
      });
    }

    // ─── All results mode ──────────────────────────────────────────────────
    const [data, totalSiswaDites] = await Promise.all([
      db.hasilTesMinatBakat.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      db.hasilTesMinatBakat.count({ where }),
    ]);

    // ─── Count total siswa for the same filter (from Siswa table) ──────────
    const siswaWhere: Record<string, unknown> = {};
    if (tahunPelajaran) siswaWhere.tahunPelajaran = tahunPelajaran;
    if (semester) siswaWhere.semester = semester;
    if (rombel) siswaWhere.rombel = rombel;

    const totalSiswa = await db.siswa.count({ where: siswaWhere });

    // ─── Distribusi: count per dominan1 ─────────────────────────────────────
    const distribusi: Record<string, number> = {};
    for (const dim of RIASEC_DIMENSIONS) {
      distribusi[dim] = 0;
    }
    for (const item of data) {
      if (item.dominan1 && item.dominan1 in distribusi) {
        distribusi[item.dominan1]++;
      }
    }

    return NextResponse.json({
      data,
      summary: {
        totalSiswaDites,
        totalSiswa,
        distribusi,
      },
    });
  } catch (error) {
    console.error("[HASIL TES MINAT BAKAT GET]", error);
    return NextResponse.json({ error: "Gagal memuat hasil tes minat bakat" }, { status: 500 });
  }
}

// ─── DELETE: Remove a test result ───────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
    }

    await db.hasilTesMinatBakat.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[HASIL TES MINAT BAKAT DELETE]", error);
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Gagal menghapus hasil tes minat bakat" }, { status: 500 });
  }
}
