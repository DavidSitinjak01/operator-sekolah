import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── GET: Fetch student's own gaya belajar result ──────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siswaId = searchParams.get("siswaId");
    const tahunPelajaran = searchParams.get("tahunPelajaran") || "2025/2026";
    const semester = searchParams.get("semester") || "Ganjil";

    if (!siswaId) {
      return NextResponse.json(
        { error: "siswaId diperlukan" },
        { status: 400 }
      );
    }

    const result = await db.hasilGayaBelajar.findFirst({
      where: { siswaId, tahunPelajaran, semester },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: result || null });
  } catch (error) {
    console.error("[SISWA PORTAL HASIL GAYA BELAJAR]", error);
    return NextResponse.json(
      { error: "Gagal memuat hasil tes gaya belajar" },
      { status: 500 }
    );
  }
}
