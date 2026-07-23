import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET: Fetch catatan siswa ──────────────────────────────────────────────
// Query params: tahunPelajaran, semester, rombel, kategori, siswaId, search
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tahunPelajaran = searchParams.get("tahunPelajaran") || "";
    const semester = searchParams.get("semester") || "Ganjil";
    const rombel = searchParams.get("rombel") || "";
    const kategori = searchParams.get("kategori") || "";
    const siswaId = searchParams.get("siswaId") || "";
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (tahunPelajaran) where.tahunPelajaran = tahunPelajaran;
    if (semester) where.semester = semester;
    if (rombel) where.rombel = rombel;
    if (kategori) where.kategori = kategori;
    if (siswaId) where.siswaId = siswaId;
    if (search) {
      where.OR = [
        { siswaNama: { contains: search } },
        { catatan: { contains: search } },
        { nisn: { contains: search } },
      ];
    }

    const data = await db.catatanSiswa.findMany({
      where,
      orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[CATATAN SISWA GET]", error);
    return NextResponse.json({ error: "Gagal memuat data catatan" }, { status: 500 });
  }
}

// ─── POST: Create catatan siswa ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { siswaId, siswaNama, nisn, rombel, tanggal, kategori, catatan, tindakan, tahunPelajaran, semester } = body;

    if (!siswaId || !tanggal || !catatan) {
      return NextResponse.json({ error: "siswaId, tanggal, dan catatan wajib diisi" }, { status: 400 });
    }

    const data = await db.catatanSiswa.create({
      data: {
        siswaId,
        siswaNama: siswaNama || "",
        nisn: nisn || "",
        rombel: rombel || "",
        tanggal,
        kategori: kategori || "Lainnya",
        catatan,
        tindakan: tindakan || "",
        tahunPelajaran: tahunPelajaran || "2025/2026",
        semester: semester || "Ganjil",
        dibuatOleh: (session.user as { name?: string })?.name || "",
      },
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[CATATAN SISWA POST]", error);
    return NextResponse.json({ error: "Gagal menyimpan catatan" }, { status: 500 });
  }
}

// ─── PUT: Update catatan siswa ────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, tanggal, kategori, catatan, tindakan } = body;

    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (tanggal !== undefined) updateData.tanggal = tanggal;
    if (kategori !== undefined) updateData.kategori = kategori;
    if (catatan !== undefined) updateData.catatan = catatan;
    if (tindakan !== undefined) updateData.tindakan = tindakan;

    const data = await db.catatanSiswa.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("[CATATAN SISWA PUT]", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Gagal mengupdate catatan" }, { status: 500 });
  }
}

// ─── DELETE: Delete catatan siswa ─────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });

    await db.catatanSiswa.delete({ where: { id } });

    return NextResponse.json({ success: true, deleted: 1 });
  } catch (error: unknown) {
    console.error("[CATATAN SISWA DELETE]", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Gagal menghapus catatan" }, { status: 500 });
  }
}
