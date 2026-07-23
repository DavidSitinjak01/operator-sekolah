import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET: Fetch hari libur ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tahunPelajaran = searchParams.get("tahunPelajaran") || "";
    const bulan = searchParams.get("bulan") || ""; // YYYY-MM

    const where: Record<string, unknown> = {};
    if (tahunPelajaran) where.tahunPelajaran = tahunPelajaran;
    if (bulan) where.tanggal = { startsWith: bulan };

    const data = await db.hariLibur.findMany({
      where,
      orderBy: { tanggal: "asc" },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[LIBUR GET]", error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

// ─── POST: Create hari libur (single or bulk) ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as { role?: string })?.role || "";
    if (role !== "admin" && role !== "operator") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const tahunPelajaran = body.tahunPelajaran || "2026/2027";

    if (body.items && Array.isArray(body.items)) {
      // Bulk
      let count = 0;
      for (const item of body.items) {
        const { tanggal, label = "", kategori = "Libur Nasional" } = item;
        if (!tanggal) continue;
        await db.hariLibur.upsert({
          where: { tanggal_tahunPelajaran: { tanggal, tahunPelajaran } },
          create: { tanggal, label, kategori, tahunPelajaran },
          update: { label, kategori },
        });
        count++;
      }
      return NextResponse.json({ success: true, count });
    }

    // Single
    const { tanggal, label = "", kategori = "Libur Nasional" } = body;
    if (!tanggal) return NextResponse.json({ error: "tanggal wajib" }, { status: 400 });

    const libur = await db.hariLibur.upsert({
      where: { tanggal_tahunPelajaran: { tanggal, tahunPelajaran } },
      create: { tanggal, label, kategori, tahunPelajaran },
      update: { label, kategori },
    });

    return NextResponse.json(libur, { status: 201 });
  } catch (error) {
    console.error("[LIBUR POST]", error);
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
  }
}

// ─── PUT: Update hari libur ────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as { role?: string })?.role || "";
    if (role !== "admin" && role !== "operator") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { id, label, kategori } = body;
    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });

    const libur = await db.hariLibur.update({
      where: { id },
      data: { label, kategori },
    });

    return NextResponse.json(libur);
  } catch (error: unknown) {
    console.error("[LIBUR PUT]", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Gagal mengupdate" }, { status: 500 });
  }
}

// ─── DELETE: Delete hari libur ──────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as { role?: string })?.role || "";
    if (role !== "admin" && role !== "operator") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const tp = searchParams.get("tahunPelajaran") || "2026/2027";

    if (id) {
      await db.hariLibur.delete({ where: { id } });
    } else {
      // Delete all for a tahun pelajaran
      await db.hariLibur.deleteMany({ where: { tahunPelajaran: tp } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LIBUR DELETE]", error);
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}
