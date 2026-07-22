import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── GET: Fetch rombel list from AbsensiSiswa (INDEPENDENT) ──────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tahunPelajaran = searchParams.get("tahunPelajaran") || "";
    const semester = searchParams.get("semester") || "Ganjil";

    if (!tahunPelajaran) {
      return NextResponse.json({ error: "tahunPelajaran wajib" }, { status: 400 });
    }

    const rombels = await db.absensiSiswa.findMany({
      where: { tahunPelajaran, semester },
      distinct: ["rombel"],
      orderBy: { rombel: "asc" },
      select: { rombel: true },
    });

    const list = rombels.map((r) => r.rombel);
    return NextResponse.json(list);
  } catch (error) {
    console.error("[ABSENSI ROMBEL GET]", error);
    return NextResponse.json({ error: "Gagal memuat rombel" }, { status: 500 });
  }
}
