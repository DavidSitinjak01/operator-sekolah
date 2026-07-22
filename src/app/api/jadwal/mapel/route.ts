import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET: List all mapel ───────────────────────────────────────────────────────
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

    const mapel = await db.mapel.findMany({
      where,
      orderBy: { kode: "asc" },
    });

    return NextResponse.json(mapel);
  } catch (error) {
    console.error("[MAPEL GET]", error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

// ─── POST: Create new mapel ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Hanya admin" }, { status: 403 });

    const body = await req.json();
    const { kode, nama, tahunPelajaran, semester } = body;

    if (!kode || !nama) {
      return NextResponse.json({ error: "Kode dan Nama mapel wajib diisi" }, { status: 400 });
    }

    const existing = await db.mapel.findFirst({
      where: {
        kode,
        tahunPelajaran: tahunPelajaran || "2025/2026",
        semester: semester || "Ganjil",
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Kode mapel sudah ada" }, { status: 400 });
    }

    const mapel = await db.mapel.create({
      data: {
        kode,
        nama,
        tahunPelajaran: tahunPelajaran || "2025/2026",
        semester: semester || "Ganjil",
      },
    });

    return NextResponse.json(mapel, { status: 201 });
  } catch (error) {
    console.error("[MAPEL POST]", error);
    return NextResponse.json({ error: "Gagal menambah mapel" }, { status: 500 });
  }
}

// ─── PUT: Update mapel ─────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Hanya admin" }, { status: 403 });

    const body = await req.json();
    const { id, kode, nama } = body;

    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });

    const mapel = await db.mapel.update({
      where: { id },
      data: { kode, nama },
    });

    return NextResponse.json(mapel);
  } catch (error: unknown) {
    console.error("[MAPEL PUT]", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Gagal mengupdate mapel" }, { status: 500 });
  }
}

// ─── DELETE: Delete mapel ───────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Hanya admin" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });

    // Check if mapel is used in any jadwal
    const usedInJadwal = await db.jadwalKelas.findFirst({
      where: { mapelId: id },
    });
    if (usedInJadwal) {
      return NextResponse.json({ error: "Mapel masih digunakan di jadwal, hapus jadwal terlebih dahulu" }, { status: 400 });
    }

    await db.mapel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[MAPEL DELETE]", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Gagal menghapus mapel" }, { status: 500 });
  }
}
