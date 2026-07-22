import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── GET: Fetch student list for attendance (from AbsensiSiswa, INDEPENDENT) ──
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tahunPelajaran = searchParams.get("tahunPelajaran") || "";
    const semester = searchParams.get("semester") || "Ganjil";
    const rombel = searchParams.get("rombel") || "";

    if (!tahunPelajaran || !rombel) {
      return NextResponse.json({ error: "tahunPelajaran dan rombel wajib" }, { status: 400 });
    }

    const data = await db.absensiSiswa.findMany({
      where: { tahunPelajaran, semester, rombel },
      orderBy: { no: "asc" },
    });

    // Sort by numeric no on the application side (same as before)
    data.sort((a, b) => (parseInt(a.no) || 0) - (parseInt(b.no) || 0));

    return NextResponse.json(data);
  } catch (error) {
    console.error("[ABSENSI SISWA GET]", error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}
