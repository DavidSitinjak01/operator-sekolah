import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET: List akses (only admin) ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Hanya admin" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const tahunPelajaran = searchParams.get("tahunPelajaran") || "";
    const semester = searchParams.get("semester") || "Ganjil";

    const where: Record<string, unknown> = {};
    if (tahunPelajaran) where.tahunPelajaran = tahunPelajaran;
    if (semester) where.semester = semester;

    const akses = await db.jadwalAkses.findMany({
      where,
      include: { user: { select: { id: true, username: true, nama: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(akses);
  } catch (error) {
    console.error("[AKSES GET]", error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

// ─── POST: Grant access to user for a rombel ──────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Hanya admin" }, { status: 403 });

    const body = await req.json();
    const { userId, rombel, tahunPelajaran, semester } = body;

    if (!userId || !rombel) {
      return NextResponse.json({ error: "User dan rombel wajib diisi" }, { status: 400 });
    }

    const tp = tahunPelajaran || "2025/2026";
    const sem = semester || "Ganjil";

    const existing = await db.jadwalAkses.findFirst({
      where: { userId, rombel, tahunPelajaran: tp, semester: sem },
    });

    if (existing) {
      return NextResponse.json({ error: "Akses sudah diberikan" }, { status: 400 });
    }

    const akses = await db.jadwalAkses.create({
      data: { userId, rombel, tahunPelajaran: tp, semester: sem },
    });

    return NextResponse.json(akses, { status: 201 });
  } catch (error) {
    console.error("[AKSES POST]", error);
    return NextResponse.json({ error: "Gagal memberikan akses" }, { status: 500 });
  }
}

// ─── DELETE: Revoke access ─────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "admin") return NextResponse.json({ error: "Hanya admin" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });

    await db.jadwalAkses.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[AKSES DELETE]", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Gagal menghapus akses" }, { status: 500 });
  }
}
