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

    const questions = await db.soalGayaBelajar.findMany({
      where: { tahunPelajaran },
      orderBy: { nomor: "asc" },
    });

    const existingResultsCount = await db.hasilGayaBelajar.count({
      where: { tahunPelajaran, semester },
    });

    return NextResponse.json({
      questions,
      existingResultsCount,
    });
  } catch (error) {
    console.error("[GAYA BELAJAR GET]", error);
    return NextResponse.json(
      { error: "Gagal memuat data gaya belajar" },
      { status: 500 }
    );
  }
}
