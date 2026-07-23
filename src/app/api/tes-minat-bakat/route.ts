import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET: Fetch all tes minat bakat questions ──────────────────────────────
// Protected (admin/operator only)
// Query params: tahunPelajaran (optional), semester (optional)
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

    // Fetch all questions ordered by nomor ascending
    const questions = await db.soalTesMinatBakat.findMany({
      where: { tahunPelajaran },
      orderBy: { nomor: "asc" },
    });

    // Count existing results for the given tahunPelajaran + semester
    const existingResultsCount = await db.hasilTesMinatBakat.count({
      where: { tahunPelajaran, semester },
    });

    return NextResponse.json({
      questions,
      existingResultsCount,
    });
  } catch (error) {
    console.error("[TES MINAT BAKAT GET]", error);
    return NextResponse.json(
      { error: "Gagal memuat data tes minat bakat" },
      { status: 500 }
    );
  }
}
