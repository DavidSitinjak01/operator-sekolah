import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET: Fetch absensi data ──────────────────────────────────────────────
// Query params: tahunPelajaran, semester, rombel, bulan (YYYY-MM), siswaId (optional)
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
    const bulan = searchParams.get("bulan") || ""; // YYYY-MM format

    const where: Record<string, unknown> = {};
    if (tahunPelajaran) where.tahunPelajaran = tahunPelajaran;
    if (semester) where.semester = semester;
    if (rombel) where.rombel = rombel;
    if (bulan) {
      // Match dates that start with the given month prefix
      where.tanggal = { startsWith: bulan };
    }

    const data = await db.absensi.findMany({
      where,
      orderBy: [{ tanggal: "asc" }, { siswaId: "asc" }],
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[ABSENSI GET]", error);
    return NextResponse.json({ error: "Gagal memuat data absensi" }, { status: 500 });
  }
}

// ─── POST: Create / Upsert absensi (single or bulk) ──────────────────────
// Body: { items: [{ siswaId, siswaNama, nisn, rombel, tanggal, kodeAbsensi }] }
//       OR single: { siswaId, siswaNama, nisn, rombel, tanggal, kodeAbsensi }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as { role?: string })?.role || "";
    if (role !== "admin" && role !== "operator") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const tahunPelajaran = body.tahunPelajaran || "2025/2026";
    const semester = body.semester || "Ganjil";

    // Bulk mode
    if (body.items && Array.isArray(body.items)) {
      const results = [];
      for (const item of body.items) {
        const { siswaId, siswaNama = "", nisn = "", rombel, tanggal, kodeAbsensi } = item;
        if (!siswaId || !tanggal || !rombel) continue;

        const result = await db.absensi.upsert({
          where: {
            siswaId_tanggal_tahunPelajaran_semester: { siswaId, tanggal, tahunPelajaran, semester },
          },
          create: {
            siswaId, siswaNama, nisn, rombel, tanggal, kodeAbsensi: kodeAbsensi || "H",
            tahunPelajaran, semester,
          },
          update: {
            kodeAbsensi: kodeAbsensi || "H",
            siswaNama: siswaNama || undefined,
            nisn: nisn || undefined,
          },
        });
        results.push(result);
      }
      return NextResponse.json({ success: true, count: results.length });
    }

    // Single mode
    const { siswaId, siswaNama = "", nisn = "", rombel, tanggal, kodeAbsensi } = body;
    if (!siswaId || !tanggal || !rombel) {
      return NextResponse.json({ error: "siswaId, tanggal, dan rombel wajib" }, { status: 400 });
    }

    const absensi = await db.absensi.upsert({
      where: {
        siswaId_tanggal_tahunPelajaran_semester: { siswaId, tanggal, tahunPelajaran, semester },
      },
      create: {
        siswaId, siswaNama, nisn, rombel, tanggal, kodeAbsensi: kodeAbsensi || "H",
        tahunPelajaran, semester,
      },
      update: {
        kodeAbsensi: kodeAbsensi || "H",
        siswaNama: siswaNama || undefined,
        nisn: nisn || undefined,
      },
    });

    return NextResponse.json(absensi, { status: 201 });
  } catch (error) {
    console.error("[ABSENSI POST]", error);
    return NextResponse.json({ error: "Gagal menyimpan absensi" }, { status: 500 });
  }
}

// ─── PUT: Update single absensi ──────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as { role?: string })?.role || "";
    if (role !== "admin" && role !== "operator") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { id, kodeAbsensi } = body;

    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });

    const absensi = await db.absensi.update({
      where: { id },
      data: { kodeAbsensi },
    });

    return NextResponse.json(absensi);
  } catch (error: unknown) {
    console.error("[ABSENSI PUT]", error);
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ error: "Gagal mengupdate absensi" }, { status: 500 });
  }
}

// ─── DELETE: Delete absensi records ─────────────────────────────────────
// Query params: id OR rombel + bulan
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
    const rombel = searchParams.get("rombel");
    const bulan = searchParams.get("bulan");
    const tp = searchParams.get("tahunPelajaran") || "2025/2026";
    const sem = searchParams.get("semester") || "Ganjil";

    if (id) {
      await db.absensi.delete({ where: { id } });
    } else if (rombel && bulan) {
      await db.absensi.deleteMany({
        where: {
          rombel,
          tahunPelajaran: tp,
          semester: sem,
          tanggal: { startsWith: bulan },
        },
      });
    } else {
      return NextResponse.json({ error: "ID atau rombel+bulan wajib" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[ABSENSI DELETE]", error);
    return NextResponse.json({ error: "Gagal menghapus absensi" }, { status: 500 });
  }
}
