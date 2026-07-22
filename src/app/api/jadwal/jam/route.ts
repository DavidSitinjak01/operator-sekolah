import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET: List all jam pelajaran ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tahunPelajaran = searchParams.get("tahunPelajaran") || "";
    const semester = searchParams.get("semester") || "Ganjil";

    const where: Record<string, unknown> = {};
    if (tahunPelajaran) where.tahunPelajaran = tahunPelajaran;
    if (semester) where.semester = semester;

    const jam = await db.jamPelajaran.findMany({
      where,
      orderBy: { jamKe: "asc" },
    });

    return NextResponse.json(jam);
  } catch (error) {
    console.error("[JAM GET]", error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

// ─── POST: Create new jam pelajaran ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Hanya admin" }, { status: 403 });

    const body = await req.json();
    const { jamKe, jamMulai, jamSelesai, tahunPelajaran, semester } = body;

    if (!jamKe || !jamMulai || !jamSelesai) {
      return NextResponse.json({ error: "Jam ke, jam mulai, dan jam selesai wajib diisi" }, { status: 400 });
    }

    const tp = tahunPelajaran || "2025/2026";
    const sem = semester || "Ganjil";

    const existing = await db.jamPelajaran.findFirst({
      where: { jamKe, tahunPelajaran: tp, semester: sem },
    });

    if (existing) {
      return NextResponse.json({ error: "Jam ke sudah ada" }, { status: 400 });
    }

    const jam = await db.jamPelajaran.create({
      data: {
        jamKe,
        jamMulai,
        jamSelesai,
        tahunPelajaran: tp,
        semester: sem,
      },
    });

    return NextResponse.json(jam, { status: 201 });
  } catch (error) {
    console.error("[JAM POST]", error);
    return NextResponse.json({ error: "Gagal menambah jam pelajaran" }, { status: 500 });
  }
}

// ─── PUT: Update jam pelajaran ──────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Hanya admin" }, { status: 403 });

    const body = await req.json();
    const { id, jamKe, jamMulai, jamSelesai } = body;

    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });

    const jam = await db.jamPelajaran.update({
      where: { id },
      data: { jamKe, jamMulai, jamSelesai },
    });

    return NextResponse.json(jam);
  } catch (error: unknown) {
    console.error("[JAM PUT]", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Gagal mengupdate jam pelajaran" }, { status: 500 });
  }
}

// ─── DELETE: Delete jam pelajaran ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Hanya admin" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });

    // Check if jam is used in any jadwal
    const jamData = await db.jamPelajaran.findUnique({ where: { id } });
    if (jamData) {
      const { searchParams } = new URL(req.url);
      const tp = searchParams.get("tahunPelajaran") || "2025/2026";
      const sem = searchParams.get("semester") || "Ganjil";
      const usedInJadwal = await db.jadwalKelas.findFirst({
        where: { jamKe: jamData.jamKe, tahunPelajaran: tp, semester: sem },
      });
      if (usedInJadwal) {
        return NextResponse.json({ error: "Jam pelajaran masih digunakan di jadwal" }, { status: 400 });
      }
    }

    await db.jamPelajaran.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[JAM DELETE]", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Gagal menghapus jam pelajaran" }, { status: 500 });
  }
}
