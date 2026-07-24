import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── GET: Fetch gaya belajar questions for student portal ───────────────
// No auth required - questions are public for students
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tahunPelajaran = searchParams.get("tahunPelajaran") || "2025/2026";

    const questions = await db.soalGayaBelajar.findMany({
      where: { tahunPelajaran },
      orderBy: { nomor: "asc" },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[SISWA PORTAL SOAL GAYA BELAJAR]", error);
    return NextResponse.json(
      { error: "Gagal memuat soal gaya belajar" },
      { status: 500 }
    );
  }
}
