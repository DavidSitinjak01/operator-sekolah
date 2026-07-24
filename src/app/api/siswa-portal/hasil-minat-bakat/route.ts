import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── GET: Fetch student's own tes minat bakat result ──────────────────
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

    const result = await db.hasilTesMinatBakat.findFirst({
      where: { siswaId, tahunPelajaran, semester },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: result || null });
  } catch (error) {
    console.error("[SISWA PORTAL HASIL MINAT BAKAT]", error);
    return NextResponse.json(
      { error: "Gagal memuat hasil tes minat bakat" },
      { status: 500 }
    );
  }
}
