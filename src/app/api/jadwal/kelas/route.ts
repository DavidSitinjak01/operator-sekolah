import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET: List jadwal kelas ────────────────────────────────────────────────────
// Supports: ?rombel=X&hari=Senin&view=kelas|guru
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tahunPelajaran = searchParams.get("tahunPelajaran") || "";
    const semester = searchParams.get("semester") || "Ganjil";
    const rombel = searchParams.get("rombel") || "";
    const guruId = searchParams.get("guruId") || "";
    const view = searchParams.get("view") || "kelas"; // "kelas" | "guru"

    const where: Record<string, unknown> = {};
    if (tahunPelajaran) where.tahunPelajaran = tahunPelajaran;
    if (semester) where.semester = semester;
    if (rombel) where.rombel = rombel;
    if (guruId) where.guruId = guruId;

    const jadwal = await db.jadwalKelas.findMany({
      where,
      orderBy: [{ hari: "asc" }, { jamKe: "asc" }],
    });

    // If view=guru, group by guru
    if (view === "guru") {
      const guruMap = new Map<string, typeof jadwal>();
      for (const j of jadwal) {
        const key = j.guruId || j.guruNama;
        if (!guruMap.has(key)) guruMap.set(key, []);
        guruMap.get(key)!.push(j);
      }
      return NextResponse.json({
        grouped: Object.fromEntries(guruMap),
        all: jadwal,
      });
    }

    return NextResponse.json(jadwal);
  } catch (error) {
    console.error("[JADWAL GET]", error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

// ─── POST: Create new jadwal entry ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") {
      // Check if user has access to this rombel
      const body = await req.json().catch(() => ({}));
      const rombel = body.rombel;
      const tp = body.tahunPelajaran || "2025/2026";
      const sem = body.semester || "Ganjil";
      const hasAccess = await db.jadwalAkses.findFirst({
        where: { userId: session.user.id, rombel, tahunPelajaran: tp, semester: sem },
      });
      if (!hasAccess) return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { hari, jamKe, mapelId, mapelKode, mapelNama, guruId, guruNama, rombel, tahunPelajaran, semester } = body;

    if (!hari || !jamKe || !mapelId || !rombel) {
      return NextResponse.json({ error: "Hari, jam, mapel, dan rombel wajib diisi" }, { status: 400 });
    }

    const tp = tahunPelajaran || "2025/2026";
    const sem = semester || "Ganjil";

    // Upsert: if entry exists for same hari+jamKe+rombel, update it
    const existing = await db.jadwalKelas.findFirst({
      where: { hari, jamKe, rombel, tahunPelajaran: tp, semester: sem },
    });

    if (existing) {
      const updated = await db.jadwalKelas.update({
        where: { id: existing.id },
        data: { mapelId, mapelKode: mapelKode || "", mapelNama: mapelNama || "", guruId: guruId || "", guruNama: guruNama || "" },
      });
      return NextResponse.json(updated);
    }

    const jadwal = await db.jadwalKelas.create({
      data: {
        hari, jamKe, mapelId,
        mapelKode: mapelKode || "",
        mapelNama: mapelNama || "",
        guruId: guruId || "",
        guruNama: guruNama || "",
        rombel,
        tahunPelajaran: tp,
        semester: sem,
      },
    });

    return NextResponse.json(jadwal, { status: 201 });
  } catch (error) {
    console.error("[JADWAL POST]", error);
    return NextResponse.json({ error: "Gagal menambah jadwal" }, { status: 500 });
  }
}

// ─── PUT: Update jadwal entry ─────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, hari, jamKe, mapelId, mapelKode, mapelNama, guruId, guruNama, rombel } = body;

    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });

    const jadwal = await db.jadwalKelas.update({
      where: { id },
      data: { hari, jamKe, mapelId, mapelKode, mapelNama, guruId, guruNama, rombel },
    });

    return NextResponse.json(jadwal);
  } catch (error: unknown) {
    console.error("[JADWAL PUT]", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Gagal mengupdate jadwal" }, { status: 500 });
  }
}

// ─── DELETE: Delete jadwal entry ───────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });

    await db.jadwalKelas.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[JADWAL DELETE]", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Gagal menghapus jadwal" }, { status: 500 });
  }
}
