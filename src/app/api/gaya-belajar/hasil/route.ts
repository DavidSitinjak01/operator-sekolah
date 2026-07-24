import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session?.user as { role?: string })?.role || "";
    if (role !== "admin" && role !== "operator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tahunPelajaran = searchParams.get("tahunPelajaran") || "2025/2026";
    const semester = searchParams.get("semester") || "Ganjil";
    const rombel = searchParams.get("rombel") || undefined;

    const where: Record<string, string> = { tahunPelajaran, semester };
    if (rombel) where.rombel = rombel;

    const results = await db.hasilGayaBelajar.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const totalSiswaDites = await db.hasilGayaBelajar.count({
      where: { tahunPelajaran, semester },
    });

    // Calculate distribution
    const allResults = await db.hasilGayaBelajar.findMany({
      where: { tahunPelajaran, semester },
    });

    const distribusi: Record<string, number> = { V: 0, A: 0, R: 0, K: 0 };
    for (const r of allResults) {
      if (r.dominan && distribusi[r.dominan] !== undefined) {
        distribusi[r.dominan] += 1;
      }
    }

    return NextResponse.json({
      results,
      statistics: {
        totalSiswaDites,
        distribusi,
      },
    });
  } catch (error) {
    console.error("[GAYA BELAJAR HASIL GET]", error);
    return NextResponse.json(
      { error: "Gagal memuat hasil tes gaya belajar" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session?.user as { role?: string })?.role || "";
    if (role !== "admin" && role !== "operator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID hasil wajib diisi" },
        { status: 400 }
      );
    }

    await db.hasilGayaBelajar.delete({ where: { id } });

    return NextResponse.json({ message: "Hasil tes berhasil dihapus" });
  } catch (error) {
    console.error("[GAYA BELAJAR HASIL DELETE]", error);
    return NextResponse.json(
      { error: "Gagal menghapus hasil tes gaya belajar" },
      { status: 500 }
    );
  }
}
