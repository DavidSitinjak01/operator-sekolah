import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── GET: Fetch tes minat bakat questions for student portal ────────────
// No auth required - questions are public for students
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tahunPelajaran = searchParams.get("tahunPelajaran") || "2025/2026";

    const questions = await db.soalTesMinatBakat.findMany({
      where: { tahunPelajaran },
      orderBy: { nomor: "asc" },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[SISWA PORTAL SOAL MINAT BAKAT]", error);
    return NextResponse.json(
      { error: "Gagal memuat soal tes minat bakat" },
      { status: 500 }
    );
  }
}
